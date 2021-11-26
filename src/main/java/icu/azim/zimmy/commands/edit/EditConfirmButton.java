package icu.azim.zimmy.commands.edit;

import org.javacord.api.event.interaction.MessageComponentCreateEvent;
import org.javacord.api.interaction.MessageComponentInteraction;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.listener.interaction.MessageComponentCreateListener;
import org.quartz.SchedulerException;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.quartz.CronUtil;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.payload.WebhookPayload;
import redis.clients.jedis.Jedis;

public class EditConfirmButton implements MessageComponentCreateListener {

	@Override
	public void onComponentCreate(MessageComponentCreateEvent event) {
		MessageComponentInteraction messageComponentInteraction = event.getMessageComponentInteraction();
		String[] customId = messageComponentInteraction.getCustomId().split(":");
		if (customId.length < 3) return;
		String command = customId[0];
		if (!command.equalsIgnoreCase("tedit")) return;
		String eid = customId[1];
		String type = customId[2];
		
		switch(type) {
		case "send":
			try(Jedis j = Zimmy.getInstance().getPool().getResource()){
				WebhookPayload.fromRedis(eid, j).execute(false).thenAccept(success->{
					messageComponentInteraction.createOriginalMessageUpdater().removeAllComponents().setContent("Message `#"+eid+"` sent.").update();
					ServerUtil.removeTask(eid, j);
					try {
						CronUtil.deleteTrigger(eid);
					} catch (SchedulerException e) {
						messageComponentInteraction.createFollowupMessageBuilder().setFlags(InteractionCallbackDataFlag.EPHEMERAL).setContent("Even though the message was successfully sent, we've got some issues unregistering it. This shouldnt happen often, but if it does please contact [support](https://discord.gg/vxfhytJbeX).").send();
						e.printStackTrace();
					}
					return;
				}).exceptionally(e->{
					messageComponentInteraction.createOriginalMessageUpdater().removeAllComponents().setContent("Error occured while sending message `#"+eid+"`:\n`"+e.getMessage()+"`").update();
					e.printStackTrace();
					return null;
				});
			}
			break;
		case "cancel":
			messageComponentInteraction.createOriginalMessageUpdater().removeAllComponents().setContent("Cancelled").update();
			break;
		}
		
	}
}
