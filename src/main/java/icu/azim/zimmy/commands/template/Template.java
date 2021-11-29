package icu.azim.zimmy.commands.template;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.stream.Stream;

import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.interaction.callback.InteractionFollowupMessageBuilder;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;
import org.javacord.api.interaction.callback.InteractionOriginalResponseUpdater;
import org.javacord.api.util.logging.ExceptionLogger;

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
				onList(jpool, event, server, updater);
				break;
			case "edit":
				onEdit(jpool, event, server, updater, options.get(0).getOptions());
				break;
			case "delete":
				onDelete(jpool, event, server, updater, options.get(0).getOptions());
				break;
			}
		}).exceptionally(ExceptionLogger.get());
	}


	private void onCreate(JedisPool jpool, 
			SlashCommandInteraction event, 
			Server server,
			InteractionOriginalResponseUpdater updater, 
			List<SlashCommandInteractionOption> options){
		
		String name = options.get(0).getStringValue().orElseThrow();
		String discourl = options.get(1).getStringValue().orElseThrow();
		String tvars = options.size()>2?options.get(2).getStringValue().orElse(""):"";
		List<String> vars = tvars.length()>0?Stream.of(tvars.split(",")).map(p->p.trim()).distinct().toList():new ArrayList<String>(1);
		String tkey = "t:"+server.getIdAsString()+":"+name;
		
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
		
		for(String p:vars) {
			matcher = Util.templateNameFormat.matcher(p);
			if(!matcher.matches()) {
				updater.setContent("Invalid property format. Needs to match `^[\\w-]{1,32}$`.").update();
				return;
			}
		}

		try(Jedis j = jpool.getResource()){
			if(j.exists(tkey+":data")) {
				updater.setContent("Such template already exists.").update();
				return;
			}
			if(j.keys("t:"+server.getId()+":*:data").size()>=20) {
				updater.setContent("You have reached your limit of 20 templates per server. If you need more, please contact bot developer with your use case and we'll discuss increasing it :)").update();
				return;
			}
			
			TemplatePayload template = new TemplatePayload();
			template.name = name;
			template.properties = new ArrayList<String>(vars);
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
			Zimmy.getInstance().updateTemplateCommand(server, j);
			Zimmy.getInstance().syncServerCommands(server);
			updater.setContent("Created template `"+name+"`.").update();
		}
	}
	
	private void onDelete(JedisPool jpool, 
			SlashCommandInteraction event, 
			Server server,
			InteractionOriginalResponseUpdater updater, 
			List<SlashCommandInteractionOption> options){
		
		String name = options.get(0).getStringValue().orElseThrow();
		String tkey = "t:"+server.getIdAsString()+":"+name;
		
		try(Jedis j = jpool.getResource()){
			if(!j.exists(tkey+":data")) {
				updater.setContent("Such template doesnt exist.").update();
				return;
			}
			j.del(tkey+":data", tkey+":properties");
			Zimmy.getInstance().updateTemplateCommand(server, j);
			Zimmy.getInstance().syncServerCommands(server);
			updater.setContent("Deleted template `"+name+"`.").update();
		}
	}
	
	private void onEdit(JedisPool jpool, 
			SlashCommandInteraction event, 
			Server server,
			InteractionOriginalResponseUpdater updater, 
			List<SlashCommandInteractionOption> options) {
		String name = options.get(0).getStringValue().orElseThrow();
		String tkey = "t:"+server.getIdAsString()+":"+name;
		String property = options.get(1).getStringValue().orElseThrow();
		String new_value = options.get(2).getStringValue().orElseThrow();
		
		try(Jedis j = jpool.getResource()){
			if(!j.exists(tkey+":data")) {
				updater.setContent("Such template doesnt exist.").update();
				return;
			}
			TemplatePayload payload = TemplatePayload.fromJedis(name, server.getIdAsString(), j);
			switch(property) {
			case "name":
				Matcher matcher = Util.templateNameFormat.matcher(new_value);
				if(!matcher.matches()) {
					updater.setContent("Invalid name format. Needs to match `^[\\w-]{1,32}$`.").update();
					return;
				}
				payload.name = new_value;
				j.del(tkey+":data", tkey+":properties");
				break;
			case "discohook_url":
				matcher = Util.shortDiscoHook.matcher(new_value);
				if(!matcher.matches()) {
					updater.setContent("Invalid discohook url.").update();
					return;
				}
				try {
					String result = Util.fromShortHook(new_value);
					if(result==null) {
						updater.setContent("Invalid discohook url, try again").update();
						return;
					}
					payload.data = result;
				} catch (IOException e) {
					updater.setContent("Invalid discohook url, try again").update();
					return;
				} catch (IllegalArgumentException e) {
					e.printStackTrace();
					updater.setContent("Unknown error:\n`"+e.getMessage()+"`").update();
					return;
				}
				
				break;
			case "variables":
				List<String> vars = new_value.length()>0?Stream.of(new_value.split(",")).map(p->p.trim()).distinct().toList():new ArrayList<String>(1);
				for(String p:vars) {
					matcher = Util.templateNameFormat.matcher(p);
					if(!matcher.matches()) {
						updater.setContent("Invalid property format. Needs to match `^[\\w-]{1,32}$`.").update();
						return;
					}
				}
				payload.properties = new ArrayList<String>(vars);
				break;
			}
			payload.saveToJedis(server.getIdAsString(), j);
			Zimmy.getInstance().updateTemplateCommand(server, j);
			Zimmy.getInstance().syncServerCommands(server);
			updater.setContent("Updated template `"+name+"`.").update();
		}
	}

	private void onList(JedisPool jpool, 
			SlashCommandInteraction event, 
			Server server,
			InteractionOriginalResponseUpdater updater) {
		InteractionFollowupMessageBuilder followup = event.createFollowupMessageBuilder();
		try(Jedis j = jpool.getResource()){
			if(j.keys("t:"+server.getId()+":*:data").isEmpty()) {
				updater.setContent("No templates saved.").update();
				return;
			}
			j.keys("t:"+server.getId()+":*:data")
			.stream()
			.map(k->k.split(":")[2])
			.sorted()
			.forEachOrdered(name->{
				TemplatePayload template = TemplatePayload.fromJedis(name, server.getIdAsString(), j);
				String description = "";
				try {
					description = "[Discohook url]("+Util.shortenHook(template.data)+")\n";
				} catch (IOException e) {
					description = "Discohook url unavailable(`"+e.getMessage()+"`)\n";
				}
				if(template.properties.isEmpty()) {
					description+="No variables";
				}else {
					description+=("Variables:\n`"+String.join("`\n`", template.properties)+"`");
				}
				followup.setFlags(InteractionCallbackDataFlag.EPHEMERAL).removeAllEmbeds().addEmbed(new EmbedBuilder()
						.setTitle(name)
						.setDescription(description))
				.send();
			});
		}
	}
}
