package icu.azim.zimmy.commands.planned;

import org.javacord.api.entity.channel.ServerTextChannel;
import org.javacord.api.entity.message.component.ActionRow;
import org.javacord.api.entity.message.component.Button;
import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.event.interaction.MessageComponentCreateEvent;
import org.javacord.api.interaction.MessageComponentInteraction;
import org.javacord.api.interaction.callback.ComponentInteractionOriginalMessageUpdater;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.listener.interaction.MessageComponentCreateListener;
import org.quartz.SchedulerException;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.quartz.CronUtil;
import icu.azim.zimmy.util.ServerUtil;
import redis.clients.jedis.Jedis;

public class DeleteButtons implements MessageComponentCreateListener{

	@Override
	public void onComponentCreate(MessageComponentCreateEvent event) {
		MessageComponentInteraction messageComponentInteraction = event.getMessageComponentInteraction();
		String[] customId = messageComponentInteraction.getCustomId().split(":");
		if (customId.length < 3) return;
		String command = customId[0];
		if (!command.equalsIgnoreCase("delete")) return;
		String id = customId[1];
		String type = customId[2];
		ServerTextChannel channel = messageComponentInteraction.getChannel().flatMap(ch -> ch.asServerTextChannel()).orElseThrow();
		if(!ServerUtil.canUse(messageComponentInteraction.getUser(), channel.getServer(), channel, Zimmy.getInstance().getPool())){
			messageComponentInteraction.createImmediateResponder().setFlags(InteractionCallbackDataFlag.EPHEMERAL).setContent("You can't use this.").respond();
			return;
		}

		try (Jedis j = Zimmy.getInstance().getPool().getResource()){
			switch(type) {
			case "yes":
				try {
					CronUtil.deleteTrigger(id);
					ServerUtil.removeTask(id, j);
					messageComponentInteraction.createOriginalMessageUpdater().removeAllComponents().removeAllEmbeds()
					.setContent(" ")
					.addEmbed(new EmbedBuilder().setDescription("Deleted message `#"+id+"`"))
					.update();
				} catch (SchedulerException e) {
					messageComponentInteraction.createImmediateResponder().setContent("Exception while creating shortened url:\n"+e.getMessage()).setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
					return;
				}
				break;
			case "cancel":
				String eid = "e:"+id;
				String mention = j.get(eid+":mention");
				Long date = Long.valueOf(j.get(eid+":date"))/1000;
				
				if(mention==null) {
					mention = "`External server`";
				}
				ComponentInteractionOriginalMessageUpdater updater = messageComponentInteraction.createOriginalMessageUpdater().removeAllComponents().removeAllEmbeds()
				.addEmbed(new EmbedBuilder().setDescription(
						"id: `"+id+"`\n"+
						"Sending to "+mention+"\n"+
						"Scheduled time: <t:"+date+":f> (<t:"+date+":R>)\n"+
						"Repeat "+CronUtil.getRepeatString(eid, j)
						)
						.setFooter("Use /edit to edit planned messages."))
				.setContent(" ");

				if(j.exists(eid+":r:type")) {
					updater.addComponents(ActionRow.of(
							Button.secondary("planned:"+id+":preview", "Preview"),
				            Button.secondary("planned:"+id+":discohook", "Generate Discohook url"),
				            Button.danger("planned:"+id+":delete", "Delete"),
				            Button.danger("planned:"+id+":unschedule", "Stop repeating")))
					.update();
				}else {
					updater.addComponents(ActionRow.of(
							Button.secondary("planned:"+id+":preview", "Preview"),
				            Button.secondary("planned:"+id+":discohook", "Generate Discohook url"),
				            Button.danger("planned:"+id+":delete", "Delete")))
					.update();
				}
				break;
			}
		}
	}
}
