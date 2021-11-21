package icu.azim.zimmy.commands.schedule;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import org.javacord.api.entity.channel.ServerTextChannel;
import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.permission.PermissionType;
import org.javacord.api.event.interaction.MessageComponentCreateEvent;
import org.javacord.api.interaction.MessageComponentInteraction;
import org.javacord.api.interaction.callback.ComponentInteractionOriginalMessageUpdater;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.listener.interaction.MessageComponentCreateListener;
import org.javacord.api.util.logging.ExceptionLogger;
import org.quartz.SchedulerException;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.TempUtil;
import icu.azim.zimmy.util.WebhookPayload;
import redis.clients.jedis.Jedis;

public class ScheduleButtons implements MessageComponentCreateListener {

	@Override
	public void onComponentCreate(MessageComponentCreateEvent event) {
		MessageComponentInteraction messageComponentInteraction = event.getMessageComponentInteraction();
	    String[] customId = messageComponentInteraction.getCustomId().split(":");
		if(customId.length<3)return;
		String command = customId[0];
		if(!command.equalsIgnoreCase("schedule")) return;
		
		String id = customId[1];
	    String type = customId[2];
	    WebhookPayload data;
	    try(Jedis j = Zimmy.getInstance().getPool().getResource()){
		    data = TempUtil.get(id,j);
		    if(data==null) {
		    	return;
		    }
	    }
	    ServerTextChannel channel = messageComponentInteraction.getChannel().flatMap(ch->ch.asServerTextChannel()).orElseThrow();
	    
	    switch(type) {
	    	case "preview":
	    		if(!channel.hasAnyPermission(event.getApi().getYourself(), PermissionType.MANAGE_WEBHOOKS, PermissionType.ADMINISTRATOR)) {
	    			messageComponentInteraction.createImmediateResponder().setContent("I need permission \"Manage webhooks\" to see which webhooks in this channel.\nGrant this permission and try again.").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
					return; 
				}
	    		channel.getIncomingWebhooks().thenAccept(webhooks->{
					if(webhooks.isEmpty()) {
						messageComponentInteraction.createImmediateResponder().setContent("This channel needs a webhook for you to be able to use previews").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond();
						return;
					}else {
						messageComponentInteraction.createImmediateResponder().setContent("Here's your message").setFlags(InteractionCallbackDataFlag.EPHEMERAL).respond().thenAccept(updater->{
							event.getApi().getThreadPool().getScheduler().schedule(()->updater.delete(), 5, TimeUnit.MINUTES);
						});
						new WebhookPayload(webhooks.get(0).getUrl().toString(), data.json).execute(true).exceptionally(ExceptionLogger.get());
						return;
					}
				});
	    		
	    		break;
	    	case "save":
				ComponentInteractionOriginalMessageUpdater updater = messageComponentInteraction.createOriginalMessageUpdater().removeAllComponents().removeAllEmbeds();
				if(data.date.before(new Date())){
					updater.setContent("Message will be sent right away").update();
					data.execute(false).thenAccept(success->{
						updater.setContent("Message sent").update();
					}).exceptionally(e->{
						updater.setContent("Error occured while sending message:\n`"+e.getMessage()+"`").update();
						return null;
					});
				} else {
					Long eid = ServerUtil.saveTask(data, data.date, channel.getServer().getId(), Zimmy.getInstance().getPool());
					channel.sendMessage(new EmbedBuilder()
							.setAuthor(event.getMessageComponentInteraction().getUser())
							.setDescription("Message `#"+eid+"` will be sent <t:"+(data.date.getTime()/1000)+":R>")
							
							);
				    
					updater.setContent("Message will be sent <t:"+(data.date.getTime()/1000)+":R>\nMessage id is `#"+eid+"`").update();
					try {
						Zimmy.getInstance().registerOnce(data.date, eid+"");
					} catch (SchedulerException e) {
						updater.setContent("Error occured while scheduling the message `#"+eid+"`.\n"+e.getMessage()).update();
						e.printStackTrace();
					}
				}
	    		break;
	    	case "cancel":
	    		event.getMessageComponentInteraction().createOriginalMessageUpdater().removeAllComponents().removeAllEmbeds().setContent("Cancelled").update();
	    		messageComponentInteraction.acknowledge();
	    		break;
	    }
	}

}
