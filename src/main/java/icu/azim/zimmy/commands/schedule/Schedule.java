package icu.azim.zimmy.commands.schedule;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;

import org.javacord.api.entity.channel.ServerTextChannel;
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
import icu.azim.zimmy.util.payload.WebhookPayload;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class Schedule implements VelenSlashEvent {
	
	@Override
	public void onEvent(
				SlashCommandCreateEvent originalEvent, 
				SlashCommandInteraction event, 
				User user,
				VelenArguments vargs, 
				List<SlashCommandInteractionOption> options,
				InteractionImmediateResponseBuilder firstResponder) {
		event.respondLater(true).thenAccept(updater->{
			Server server = event.getServer().orElseThrow();
			JedisPool jpool = Zimmy.getInstance().getPool();
			
			String type = options.get(0).getName();
			List<SlashCommandInteractionOption> args = options.get(0).getOptions();
			String webhook;
			if(type.equalsIgnoreCase("channel")) { //get webhook from channel
				if(!args.get(0).getChannelValue().flatMap(ch->ch.asServerTextChannel()).isPresent()) {
					updater.setContent("Invalid target channel, try again.").update();
					return;
				}
				ServerTextChannel tchannel = args.get(0).getChannelValue().flatMap(ch->ch.asServerTextChannel()).get();
				if(tchannel.getServer().getId()!=server.getId()) {
					updater.setContent("This channel is from another server. Provide a webhook url instead.").update();
					return;
				}
				if(!tchannel.hasAnyPermission(event.getApi().getYourself(), PermissionType.MANAGE_WEBHOOKS, PermissionType.ADMINISTRATOR)) {
					updater.setContent("I need permission \"Manage webhooks\" to see which webhooks this channel has.\nGrant this permission and try again, or use webhook url instead").update();
					return;
				}
				List<IncomingWebhook> webhooks = tchannel.getIncomingWebhooks().join();//join =\
				if(webhooks.isEmpty()) {
					updater.setContent("No webhooks found in that channel, try again.\nWhat are webhooks? Read here: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks").update();
					return;
				}else {
					webhook = webhooks.get(0).getUrl().toString();
				}
			}else if(type.equalsIgnoreCase("webhook")) { //check if it even matches webhook pattern
				webhook = args.get(0).getStringValue().orElseThrow();
				Matcher matcher = DiscordRegexPattern.WEBHOOK_URL.matcher(webhook);
				if(!matcher.matches()) {
					updater.setContent("Invalid url, try again.").update();
					return;
				}
			}else {
				return;
			}
			
			String discourl = args.get(1).getStringValue().orElseThrow();
			String datetime = args.get(2).getStringValue().orElseThrow();

			WebhookPayload data = new WebhookPayload(webhook);
			
			args.get(0).getChannelValue().flatMap(ch->ch.asServerTextChannel()).ifPresentOrElse(ch->{
				data.channelMention = ch.getMentionTag();
			},()->{
				data.channelMention = "`External server`";
			});
			
			try {
				IncomingWebhook hook = event.getApi().getIncomingWebhookByUrl(webhook).join(); //check if webhook exists
				hook.getChannel().map(ch->ch.asServerTextChannel().get()).ifPresent(ch->{
					if(ch.getServer().getId()==server.getId())
						data.channelMention = ch.getMentionTag();
				});
			}catch(CompletionException e) {
				if(e.getCause() instanceof MissingPermissionsException) {
					data.channelMention = "`External server`";
				}else {
					updater.setContent("Unable to fetch webhook (webhook doesnt exist?):\n"+e.getMessage()).update();
					return;
				}
			}
			
			Matcher matcher = Util.shortDiscoHook.matcher(discourl); 
			if(matcher.matches()) { //check if discohook url is proper format and retrieve json info
				try {
					String result = Util.fromShortHook(discourl);
					if(result==null) {
						updater.setContent("Invalid discohook url, try again").update();
						return;
					}
					data.json = result;
				} catch (IOException e) {
					updater.setContent("Invalid discohook url, try again").update();
					return;
				} catch (IllegalArgumentException e) {
					e.printStackTrace();
					updater.setContent("Unknown error:\n`"+e.getMessage()+"`").update();
					return;
				}
			}else {
				updater.setContent("Invalid discohook url, try again").update();
				return;
			}
			
			if(!data.isValid()) {
				updater.setContent("Error occured while parsing message, try again. \n`Invalid json`").update();
				return;
			}
			
			SimpleDateFormat formatter = new SimpleDateFormat(Util.dateTimeFormat);
			String timezone;
			try(Jedis j = jpool.getResource()){
				timezone = j.get("s:"+server.getId()+":timezone");
			}
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
				updater.setContent("Invalid date.\nExpected "+Util.dateTimeFormat).update();
				return;
			}
			
			Long ldate = tdate.getTime()/1000;
			
			if(tdate.before(new Date())) {
				updater.addEmbed(new EmbedBuilder().setDescription(
						"Sending to "+data.channelMention+"\n"+
						"Entered time is <t:"+ldate+":R>, message will be sent right away.\n"+
						"Are you sure you want to send it now?"
						));
			}else {
				updater.addEmbed(new EmbedBuilder().setDescription(
						"Sending to "+data.channelMention+"\n"+
						"Scheduled time: <t:"+ldate+":f> (<t:"+ldate+":R>)\n"+
						"Looks good?"
						));
			}
			//TODO store event.getId(), date and data until button is pressed or 15 minutes has passed
			data.date = tdate;
			try(Jedis j = jpool.getResource()){
				TempUtil.put(event.getIdAsString(), data, j);
			}
			
			//TempUtil.data.put(event.getIdAsString(), data);
			//TempUtil.planRemoval(event.getIdAsString(), event.getApi());
			
			updater.addComponents(
					ActionRow.of(
							Button.secondary("schedule:"+event.getId()+":preview", "Preview"),
				            Button.success("schedule:"+event.getId()+":save", "Save"),
				            Button.danger("schedule:"+event.getId()+":cancel", "Cancel"))
					).update().thenAccept(a->{
						a.getApi().getThreadPool().getScheduler().schedule(()->{
							updater.removeAllComponents().removeAllEmbeds().setContent("Message expired.");
						}, 15, TimeUnit.MINUTES);
					});
			
		}).exceptionally(ExceptionLogger.get());
		
	}

}
