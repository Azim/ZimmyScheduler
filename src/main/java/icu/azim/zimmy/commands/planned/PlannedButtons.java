package icu.azim.zimmy.commands.planned;

import java.io.IOException;
import java.util.Date;

import org.javacord.api.entity.channel.ServerTextChannel;
import org.javacord.api.entity.message.component.ActionRow;
import org.javacord.api.entity.message.component.Button;
import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.permission.PermissionType;
import org.javacord.api.event.interaction.MessageComponentCreateEvent;
import org.javacord.api.interaction.MessageComponentInteraction;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.listener.interaction.MessageComponentCreateListener;
import org.javacord.api.util.logging.ExceptionLogger;
import org.quartz.SchedulerException;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.quartz.CronUtil;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.Util;
import icu.azim.zimmy.util.payload.WebhookPayload;
import redis.clients.jedis.Jedis;

public class PlannedButtons implements MessageComponentCreateListener {

	@Override
	public void onComponentCreate(MessageComponentCreateEvent event) {
		MessageComponentInteraction messageComponentInteraction = event.getMessageComponentInteraction();
		String[] customId = messageComponentInteraction.getCustomId().split(":");
		if (customId.length < 3) return;
		String command = customId[0];
		if (!command.equalsIgnoreCase("planned")) return;
		String eid = customId[1];
		String type = customId[2];
		ServerTextChannel channel = messageComponentInteraction.getChannel().flatMap(ch -> ch.asServerTextChannel()).orElseThrow();
		if(!ServerUtil.canUse(messageComponentInteraction.getUser(), channel.getServer(), channel, Zimmy.getInstance().getPool())){
			messageComponentInteraction.createImmediateResponder().setFlags(InteractionCallbackDataFlag.EPHEMERAL).setContent("You can't use this.").respond();
			return;
		}
		try (Jedis j = Zimmy.getInstance().getPool().getResource()) {
			WebhookPayload data = WebhookPayload.fromRedis(eid, j);

			switch (type) {
			case "preview":
				if (!channel.hasAnyPermission(event.getApi().getYourself(), PermissionType.MANAGE_WEBHOOKS, PermissionType.ADMINISTRATOR)) {
					messageComponentInteraction.createImmediateResponder().setContent("I need permission \"Manage webhooks\" to see which webhooks in this channel.\nGrant this permission and try again.").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
					return;
				}
				channel.getIncomingWebhooks().thenAccept(webhooks -> {
					if (webhooks.isEmpty()) {
						messageComponentInteraction.createImmediateResponder() .setContent("This channel needs a webhook for you to be able to use previews").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
						return;
					} else {
						messageComponentInteraction.createImmediateResponder().setContent("Here's your message").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
						new WebhookPayload(webhooks.get(0).getUrl().toString(), data.json).execute(true).exceptionally(ExceptionLogger.get());
						return;
					}
				}).exceptionally(ExceptionLogger.get());

				break;
			case "discohook":
				try {
					String url = Util.shortenHook(data.json);
					Long date = Long.valueOf(j.get("e:"+eid+":date"))/1000;
					
					event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllEmbeds().addEmbed(new EmbedBuilder().setDescription(
							"id: `"+eid+"`\n"+
							"Sending to "+data.channelMention+"\n"+
							"Scheduled time: <t:"+date+":f> (<t:"+date+":R>)\n"+
							"Repeat "+CronUtil.getRepeatString("e:"+eid, j)+"\n"+
							"[Discohook url]("+url+")"
							)
							.setFooter("Use /edit to edit planned messages."))
					.removeAllComponents().addComponents(ActionRow.of(
							Button.secondary("planned:"+eid+":preview", "Preview"),
				            Button.danger("planned:"+eid+":delete", "Delete")))
					.setContent("")
					.update();
				} catch (IOException e) {
					messageComponentInteraction.createImmediateResponder().setContent("Exception while creating shortened url:\n"+e.getMessage()).setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
					return;
				}
				break;
			case "delete":
				event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllComponents().setContent(" ").removeAllEmbeds()
				.addEmbed(new EmbedBuilder().setDescription("Are you sure?"))
				.addComponents(ActionRow.of(
						Button.danger("delete:"+eid+":yes", "Delete"),
			            Button.secondary("delete:"+eid+":cancel", "Cancel")))
				.update();
				
				break;
			case "unschedule":
				Date date = new Date(Long.valueOf(j.get("e:"+eid+":date")));
				if(date.before(new Date())) {
					event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllComponents().setContent(" ").removeAllEmbeds()
					.addEmbed(new EmbedBuilder().setDescription("This message already was sent before, it will be deleted entirely.\nAre you sure you want to delete this message?"))
					.addComponents(ActionRow.of(
							Button.danger("delete:"+eid+":yes", "Delete"),
				            Button.secondary("delete:"+eid+":cancel", "Cancel")))
					.update();
					return;
				}
				try {
					if(!CronUtil.makeRepeatOnce(eid)) {
						event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllComponents().setContent(" ").removeAllEmbeds()
						.addEmbed(new EmbedBuilder().setDescription("Message not found in the database. Try changing it's date to fix that."))
						.update();
						return;
					}
					j.del("e:"+eid+":r:type", "e:"+eid+":r:pattern");
					Long ldate = Long.valueOf(j.get("e:"+eid+":date"))/1000;
					event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllEmbeds().addEmbed(new EmbedBuilder().setDescription(
							"id: `"+eid+"`\n"+
							"Sending to "+data.channelMention+"\n"+
							"Scheduled time: <t:"+ldate+":f> (<t:"+ldate+":R>)\n"+
							"Repeat "+CronUtil.getRepeatString("e:"+eid, j)
							)
							.setFooter("Use /edit to edit planned messages."))
					.removeAllComponents().addComponents(ActionRow.of(
							Button.secondary("planned:"+eid+":preview", "Preview"),
				            Button.secondary("planned:"+eid+":discohook", "Generate Discohook url"),
				            Button.danger("planned:"+eid+":delete", "Delete")))
					.setContent("")
					.update();
				} catch (SchedulerException e) {
					event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllComponents().setContent(" ").removeAllEmbeds()
					.addEmbed(new EmbedBuilder().setDescription("Error while changing schedule.\n`"+e.getMessage()+"`"))
					.update();
					return;
				}
				
				break;
			}
		}
	}

}
