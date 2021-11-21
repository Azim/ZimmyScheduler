package icu.azim.zimmy.commands.planned;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

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
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.Util;
import icu.azim.zimmy.util.WebhookPayload;
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
						messageComponentInteraction.createImmediateResponder().setContent("Here's your message").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond().thenAccept(updater -> {
									event.getApi().getThreadPool().getScheduler().schedule(() -> updater.delete(), 5, TimeUnit.MINUTES);
								});
						new WebhookPayload(webhooks.get(0).getUrl().toString(), data.json).execute(true).exceptionally(ExceptionLogger.get());
						return;
					}
				});

				break;
			case "discohook":
				try {
					String url = Util.shortenHook(data.json);
					Long date = Long.valueOf(j.get("e:"+eid+":date"))/1000;
					event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllEmbeds().addEmbed(new EmbedBuilder().setDescription(
							"`#"+eid+"`\n"+
							"Sending to "+data.channelMention+"\n"+
							"Scheduled time: <t:"+date+":f> (<t:"+date+":R>)\n"+
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
				try { //TODO confirmation
					Zimmy.getInstance().deleteTrigger(eid);
					ServerUtil.removeTask(eid, j);
					event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllEmbeds().removeAllComponents().setContent("Message `#"+eid+"` deleted").update();
				} catch (SchedulerException e) {
					messageComponentInteraction.createImmediateResponder().setContent("Exception while creating shortened url:\n"+e.getMessage()).setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
					return;
				}
				
				break;
			}
		}
	}

}
