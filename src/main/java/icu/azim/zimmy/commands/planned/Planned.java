package icu.azim.zimmy.commands.planned;

import java.util.List;
import org.javacord.api.entity.message.component.ActionRow;
import org.javacord.api.entity.message.component.Button;
import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.interaction.callback.InteractionFollowupMessageBuilder;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;

import icu.azim.zimmy.Zimmy;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class Planned implements VelenSlashEvent {

	@Override
	public void onEvent(
			SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments args, 
			List<SlashCommandInteractionOption> options,
			InteractionImmediateResponseBuilder firstResponder) {
		Server server = event.getServer().orElseThrow();
		JedisPool jpool = Zimmy.getInstance().getPool();
		
		event.respondLater(true).thenAccept(updater->{
			try(Jedis j = jpool.getResource()){
				List<String> planned = j.lrange("s:"+server.getId()+":planned", 0, -1);
				if(planned.isEmpty()) {
					updater.setContent("There are no planned tasks right now.").update();
					return;
				}
				InteractionFollowupMessageBuilder followup = event.createFollowupMessageBuilder().setFlags(InteractionCallbackDataFlag.EPHEMERAL);
				followup.setContent("Currently planned tasks:").send();
				
				for(String id:planned) {
					String eid = "e:"+id;
					String mention = j.get(eid+":mention");
					Long date = Long.valueOf(j.get(eid+":date"))/1000;
					
					if(mention==null) {
						mention = "`External server`";
					}
					
					followup.removeAllComponents().removeAllEmbeds()
					.addEmbed(new EmbedBuilder().setDescription(
							"id: `"+id+"`\n"+
							"Sending to "+mention+"\n"+
							"Scheduled time: <t:"+date+":f> (<t:"+date+":R>)"
							)
							.setFooter("Use /edit to edit planned messages."))
					.addComponents(ActionRow.of(
							Button.secondary("planned:"+id+":preview", "Preview"),
				            Button.secondary("planned:"+id+":discohook", "Generate Discohook url"),
				            Button.danger("planned:"+id+":delete", "Delete")))
					.setContent("")
					.send();
				}
			}
		});
	}

}
