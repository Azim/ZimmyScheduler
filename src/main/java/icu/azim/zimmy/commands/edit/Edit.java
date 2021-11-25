package icu.azim.zimmy.commands.edit;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;
import java.util.concurrent.CompletionException;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;

import org.javacord.api.entity.message.component.ActionRow;
import org.javacord.api.entity.message.component.Button;
import org.javacord.api.entity.permission.PermissionType;
import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.entity.webhook.IncomingWebhook;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.exception.MissingPermissionsException;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;
import org.javacord.api.util.DiscordRegexPattern;
import org.javacord.api.util.logging.ExceptionLogger;
import org.quartz.SchedulerException;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.Util;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import pw.mihou.velen.utils.VelenUtils;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class Edit implements VelenSlashEvent {

	@Override
	public void onEvent(SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments args, 
			List<SlashCommandInteractionOption> options,
			InteractionImmediateResponseBuilder firstResponder) {
		Server server = event.getServer().orElseThrow();
		JedisPool jpool = Zimmy.getInstance().getPool();
		
		event.respondLater(true).thenAccept(updater->{
			long id = options.get(0).getLongValue().orElseThrow();
			String type = options.get(1).getStringValue().orElseThrow();
			String nvalue = options.get(2).getStringValue().orElseThrow();
			
			switch(type) {
			case "destination":
				AtomicReference<String> url = new AtomicReference<>();
				AtomicReference<String> mention = new AtomicReference<>();
				VelenUtils.getOrderedChannelMentions(Zimmy.getInstance().api, nvalue).stream().map(ch->ch.asServerTextChannel()).filter(ch->ch.isPresent()).map(ch->ch.get()).findFirst().ifPresentOrElse(channel->{
					if(channel.getServer().getId()!=server.getId()) {
						updater.setContent("This channel is from another server.").update();
						return;
					}
					if(!channel.hasAnyPermission(event.getApi().getYourself(), PermissionType.MANAGE_WEBHOOKS, PermissionType.ADMINISTRATOR)) {
						updater.setContent("I need permission \"Manage webhooks\" to see which webhooks this channel has.\nGrant this permission and try again, or use webhook url instead").update();
						return;
					}
					List<IncomingWebhook> webhooks = channel.getIncomingWebhooks().join();//join =\
					if(webhooks.isEmpty()) {
						updater.setContent("No webhooks found in that channel, try again.").update();
						return;
					}else {
						url.set(webhooks.get(0).getUrl().toString());
						mention.set(channel.getMentionTag());
					}
					try(Jedis j = jpool.getResource()){
						j.set("e:"+id+":url", url.get());
						j.set("e:"+id+":mention", mention.get());
					}
					updater.setContent("Message `#"+id+"` updated.").update();
					
				}, ()->{	//no channel mention, check if url
					String webhook = options.get(2).getStringValue().orElseThrow();
					Matcher matcher = DiscordRegexPattern.WEBHOOK_URL.matcher(webhook);
					if(!matcher.matches()) {
						updater.setContent("Invalid url, try again.").update();
						return;
					}
					try {
						event.getApi().getIncomingWebhookByUrl(webhook).join(); //check if webhook exists
						mention.set("`External server`");
					}catch(CompletionException e) {
						if(e.getCause() instanceof MissingPermissionsException) {
							mention.set("`External server`");
						}else {
							updater.setContent("Unable to fetch webhook (webhook doesnt exist?):\n"+e.getMessage()).update();
							return;
						}
					}
					url.set(webhook);
					try(Jedis j = jpool.getResource()){
						j.set("e:"+id+":url", url.get());
						j.set("e:"+id+":mention", mention.get());
					}
					updater.setContent("Message `#"+id+"` updated.").update();
				});
				break;
			case "discohook_url":
				Matcher matcher = Util.shortDiscoHook.matcher(nvalue);
				String json; 
				if(matcher.matches()) { //check if discohook url is proper format and retrieve json info
					try {
						String result = Util.fromShortHook(nvalue);
						if(result==null) {
							updater.setContent("Invalid discohook url, try again").update();
							return;
						}
						json = result;
						try {
							new Gson().fromJson(json, JsonObject.class);
						} catch(Exception e) { 
							updater.setContent("Invalid json, try again").update();
							return;
						}
						try(Jedis j = jpool.getResource()){
							j.set("e:"+id+":data", json);
						}
						updater.setContent("Message `#"+id+"` updated.").update();
					} catch (IOException e) {
						updater.setContent("Invalid discohook url, try again").update();
						return;
					}
				}else {
					updater.setContent("Invalid discohook url, try again").update();
					return;
				}
				break;
			case "datetime":
				SimpleDateFormat formatter = new SimpleDateFormat(Util.dateTimeFormat);
				String timezone;
				try(Jedis j = jpool.getResource()){
					timezone = j.get("s:"+server.getId()+":timezone");
				}
				if(timezone==null) {
					timezone = "GMT";
				}
				formatter.setTimeZone(TimeZone.getTimeZone(timezone));

				if(nvalue.matches(Util.timeRegex)) {
					Date now = new Date();

					SimpleDateFormat f = new SimpleDateFormat(Util.dateFormat);
					f.setTimeZone(TimeZone.getTimeZone(timezone));

					String snow = f.format(now);
					nvalue = snow+" "+nvalue;
				}
				Date date;
				try {
					date = formatter.parse(nvalue);
				} catch (ParseException e) {
					updater.setContent("Invalid date format, expected "+Util.dateTimeFormat).update();
					return;
				}
				if(date.before(new Date())) {
					updater.setContent("Entered time (<t:"+(date.getTime()/1000)+":f>) already passed, message will be sent **right now**.\nAre you sure?").addComponents(ActionRow.of(
							Button.primary("tedit:"+id+":send", "Send now"),
				            Button.danger("tedit:"+id+":cancel", "Cancel")
							)).update();
				}else {
					try {
						try(Jedis j = jpool.getResource()){
							boolean repeat = j.get("e:"+id+":cron")!=null;
							
							Zimmy.getInstance().editTime(date, id+"", repeat);
							
							ServerUtil.editTaskDate(id+"", date, j);
						}
						updater.setContent("Message `#"+id+"` updated.").update();
					} catch (SchedulerException e) {
						updater.setContent("Exception while editing trigger: "+e.getMessage()).update();
						e.printStackTrace();
						return;
					}
				}
				break;
			}
			
		}).exceptionally(ExceptionLogger.get());
	}

}
