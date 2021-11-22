package icu.azim.zimmy.commands.template;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.regex.Matcher;
import java.util.stream.Stream;

import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;
import org.javacord.api.interaction.callback.InteractionOriginalResponseUpdater;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.Util;
import icu.azim.zimmy.util.payload.TemplatePayload;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class Template implements VelenSlashEvent {

	@Override
	public void onEvent(SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments args, 
			List<SlashCommandInteractionOption> options,
			InteractionImmediateResponseBuilder firstResponder) {
		
		event.respondLater(true).thenAccept(updater->{
			Server server = event.getServer().orElseThrow();
			JedisPool jpool = Zimmy.getInstance().getPool();
			
			String type = options.get(0).getName();
			switch(type) {
			case "create":
				onCreate(jpool, event, server, updater, options.get(0).getOptions());
				break;
			case "list":
				
				break;
			case "edit":
				
				break;
			case "delete":
				onDelete(jpool, event, server, updater, options.get(0).getOptions());
				break;
			}
		});
	}

	
	private void onCreate(JedisPool jpool, 
			SlashCommandInteraction event, 
			Server server,
			InteractionOriginalResponseUpdater updater, 
			List<SlashCommandInteractionOption> options) throws NoSuchElementException {
		
		String name = options.get(0).getStringValue().orElseThrow();
		String discourl = options.get(1).getStringValue().orElseThrow();
		String tproperties = options.get(2).getStringValue().orElse("");
		List<String> properties = Stream.of(tproperties.split(",")).map(p->p.trim()).toList();
		
		Matcher matcher = Util.templateNameFormat.matcher(name);
		if(!matcher.matches()) {
			updater.setContent("Invalid name format. Needs to match `^[\\w-]{1,32}$`.").update();
			return;
		}
		
		matcher = Util.shortDiscoHook.matcher(discourl);
		if(!matcher.matches()) {
			updater.setContent("Invalid discohook url.").update();
			return;
		}
		
		for(String p:properties) {
			matcher = Util.templateNameFormat.matcher(p);
			if(!matcher.matches()) {
				updater.setContent("Invalid property format. Needs to match `^[\\w-]{1,32}$`.").update();
				return;
			}
		}

		try(Jedis j = jpool.getResource()){
			if(j.exists("t:"+server.getIdAsString()+":"+name+":data")) {
				updater.setContent("Such template already exists.").update();
				return;
			}
			TemplatePayload template = new TemplatePayload();
			template.name = name;
			template.properties = new ArrayList<String>(properties);
			try {
				String result = Util.fromShortHook(discourl);
				if(result==null) {
					updater.setContent("Invalid discohook url, try again").update();
					return;
				}
				template.data = result;
			} catch (IOException e) {
				updater.setContent("Invalid discohook url, try again").update();
				return;
			} catch (IllegalArgumentException e) {
				e.printStackTrace();
				updater.setContent("Unknown error:\n`"+e.getMessage()+"`").update();
				return;
			}
			
			template.saveToJedis(server.getIdAsString(), j);
			Zimmy.getInstance().createTemplateCommand(server, template);
			Zimmy.getInstance().syncServerCommands();
			updater.setContent("Created template `"+name+"`.").update();
		}
	}
	
	private void onDelete(JedisPool jpool, 
			SlashCommandInteraction event, 
			Server server,
			InteractionOriginalResponseUpdater updater, 
			List<SlashCommandInteractionOption> options) throws NoSuchElementException {
		
		String name = options.get(0).getStringValue().orElseThrow();
		try(Jedis j = jpool.getResource()){
			if(!j.exists("t:"+server.getIdAsString()+":"+name+":data")) {
				updater.setContent("Such template doesnt exist.").update();
				return;
			}
			
			
			
		}
	}
}
