package icu.azim.zimmy.commands.template;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.stream.Collectors;

import org.javacord.api.entity.message.component.ActionRow;
import org.javacord.api.entity.message.component.Button;
import org.javacord.api.entity.message.embed.EmbedBuilder;
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

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.TempUtil;
import icu.azim.zimmy.util.Util;
import icu.azim.zimmy.util.payload.TemplatePayload;
import icu.azim.zimmy.util.payload.WebhookPayload;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import pw.mihou.velen.utils.VelenUtils;
import redis.clients.jedis.Jedis;

public class TemplateUse implements VelenSlashEvent {

	@Override
	public void onEvent(SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments args, 
			List<SlashCommandInteractionOption> topoptions,
			InteractionImmediateResponseBuilder firstResponder) {
		
		SlashCommandInteractionOption subcommand = topoptions.get(0).getOptions().get(0);
		String name = subcommand.getName();
		Server server = event.getServer().orElseThrow();
		List<SlashCommandInteractionOption> options = subcommand.getOptions();
		event.respondLater(true).thenAccept(responder->{
			try(Jedis j = Zimmy.getInstance().getPool().getResource()){
				TemplatePayload template = TemplatePayload.fromJedis(name, event.getServer().orElseThrow().getIdAsString(), j);
				if(template==null) {
					responder.setContent("Template not found!").update();
					return;
				}
				String dest = options.get(0).getStringValue().orElseThrow();
				String datetime = options.get(1).getStringValue().orElseThrow();
				Map<String, String> variables = options.size()>2? options.subList(2, options.size()).stream().collect(Collectors.toMap(SlashCommandInteractionOption::getName, o->o.getStringValue().orElseThrow())):new HashMap<>();;
				
				AtomicReference<String> url = new AtomicReference<>();
				AtomicReference<String> mention = new AtomicReference<>();
				AtomicBoolean stop = new AtomicBoolean(false);
				
				VelenUtils.getOrderedChannelMentions(Zimmy.getInstance().api, dest).stream().map(ch->ch.asServerTextChannel()).filter(ch->ch.isPresent()).map(ch->ch.get()).findFirst().ifPresentOrElse(channel->{
					if(channel.getServer().getId()!=server.getId()) {
						responder.setContent("This channel is from another server.").update();
						stop.set(true);
						return;
					}
					if(!channel.hasAnyPermission(event.getApi().getYourself(), PermissionType.MANAGE_WEBHOOKS, PermissionType.ADMINISTRATOR)) {
						responder.setContent("I need permission \"Manage webhooks\" to see which webhooks this channel has.\nGrant this permission and try again, or use webhook url instead").update();
						stop.set(true);
						return;
					}
					List<IncomingWebhook> webhooks = channel.getIncomingWebhooks().join();//join =\
					if(webhooks.isEmpty()) {
						responder.setContent("No webhooks found in that channel, try again.").update();
						stop.set(true);
						return;
					}else {
						url.set(webhooks.get(0).getUrl().toString());
						mention.set(channel.getMentionTag());
					}
				}, ()->{	//no channel mention, check if url
					Matcher matcher = DiscordRegexPattern.WEBHOOK_URL.matcher(dest);
					if(!matcher.matches()) {
						responder.setContent("Invalid url, try again.").update();
						stop.set(true);
						return;
					}
					try {
						event.getApi().getIncomingWebhookByUrl(dest).join(); //check if webhook exists
						mention.set("`External server`");
					}catch(CompletionException e) {
						if(e.getCause() instanceof MissingPermissionsException) {
							mention.set("`External server`");
						}else {
							responder.setContent("Unable to fetch webhook (webhook doesnt exist?):\n"+e.getMessage()).update();
							stop.set(true);
							return;
						}
					}
					url.set(dest);
				});
				if(stop.get()) {
					return;
				}
				WebhookPayload payload = WebhookPayload.fromTemplate(url.get(), server.getIdAsString(), name, j, variables);
				payload.channelMention = mention.get();
				if(!payload.isValid()) {
					responder.setContent("Error occured while parsing message, try again. \n`Invalid json`").update();
					return;
				}
				
				SimpleDateFormat formatter = new SimpleDateFormat(Util.dateTimeFormat);
				String timezone;
				timezone = j.get("s:"+server.getId()+":timezone");
				if(timezone==null) {
					timezone = "GMT";
				}
				formatter.setTimeZone(TimeZone.getTimeZone(timezone));
				
				if(datetime.matches(Util.timeRegex)) {
					Date now = new Date();
					SimpleDateFormat f = new SimpleDateFormat(Util.dateFormat);
					f.setTimeZone(TimeZone.getTimeZone(timezone));
					String snow = f.format(now);
					datetime = snow+" "+datetime;
				}
				Date tdate;
				try {
					tdate = formatter.parse(datetime);
				} catch (ParseException e) {
					responder.setContent("Invalid date.\nExpected "+Util.dateTimeFormat).update();
					return;
				}
				
				Long ldate = tdate.getTime()/1000;
				
				if(tdate.before(new Date())) {
					responder.addEmbed(new EmbedBuilder().setDescription(
							"Sending to "+payload.channelMention+"\n"+
							"Entered time is <t:"+ldate+":R>, message will be sent right away.\n"+
							"Are you sure you want to send it now?"
							));
				}else {
					responder.addEmbed(new EmbedBuilder().setDescription(
							"Sending to "+payload.channelMention+"\n"+
							"Scheduled time: <t:"+ldate+":f> (<t:"+ldate+":R>)\n"+
							"Looks good?"
							));
				}
				payload.date = tdate;
				TempUtil.put(event.getIdAsString(), payload, j);
				
				responder.addComponents(
						ActionRow.of(
								Button.secondary("schedule:"+event.getId()+":preview", "Preview"),
					            Button.success("schedule:"+event.getId()+":save", "Save"),
					            Button.danger("schedule:"+event.getId()+":cancel", "Cancel"))
						).update().thenAccept(a->{
							a.getApi().getThreadPool().getScheduler().schedule(()->{
								responder.removeAllComponents().removeAllEmbeds().setContent("Message expired.");
							}, 15, TimeUnit.MINUTES);
						});
				
			}
		}).exceptionally(ExceptionLogger.get());
	}

}
