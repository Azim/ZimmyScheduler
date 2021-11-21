package icu.azim.zimmy.util.payload;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.javacord.api.entity.message.WebhookMessageBuilder;
import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.message.mention.AllowedMentionsBuilder;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.Util;
import pw.mihou.velen.utils.Pair;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class WebhookPayload {
	public String url;
	public String json;
	
	public String channelMention;
	public Boolean publish;
	
	public Date date;

	public WebhookPayload(String url) {
		this.url = url;
		publish = false;
	}
	
	public WebhookPayload(String url, String json) {
		this.url = url;
		this.json = json;
		publish = false;
	}
	
	public static WebhookPayload fromRedis(String id, Jedis j) {
		String url = j.get("e:"+id+":url");
		if(url == null)return null;
		WebhookPayload result = new WebhookPayload(url);
		result.json = j.get("e:"+id+":data");
		result.channelMention = j.get("e:"+id+":mention");
		result.date = new Date(Long.valueOf(j.get("e:"+id+":date")));
		String publish = j.get("e:"+id+":publish");
		boolean repost = true;
		if(publish==null) {
			repost = false;
		}else if(publish.equalsIgnoreCase("false")) {
			repost = false;
		}
		result.publish = repost;
		return result;
	}

	public static WebhookPayload fromTemplate(String url, String server, String name, Jedis j, List<Pair<String, String>> properties) {
		TemplatePayload template = TemplatePayload.fromJedis(name, server, j);
		WebhookPayload payload = new WebhookPayload(url, template.data);
		for(Pair<String, String> property:properties) {
			payload.json.replace("%"+property.getLeft()+"%", property.getRight()); //.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n")); //TODO maybe some proper ways of doing it sometime
		}
		return payload;
	}

	public static List<WebhookPayload> fromRedisDate(Date date, JedisPool jpool) {
		try(Jedis j = jpool.getResource()){
			if(!j.exists("e:sendAt:"+date.getTime())) return new ArrayList<WebhookPayload>();
			if(j.llen("e:sendAt:"+date.getTime())<1) return new ArrayList<WebhookPayload>();
			return j.lrange("e:sendAt:"+date.getTime(), 0, -1).stream().map(id->fromRedis(id,j)).collect(Collectors.toList());
		}
	}
	
	public void fromFile(InputStream inputStream) {
		json = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8)).lines().collect(Collectors.joining("\n"));
	}
	
	public boolean isValid() {
		try {
			new Gson().fromJson(json, JsonObject.class);
			return true;
		} catch(Exception e) { 
			return false;
		}
	}
	
	public CompletableFuture<Boolean> execute(boolean silent) {
		CompletableFuture<Boolean> result = new CompletableFuture<Boolean>();
		Zimmy.getInstance().api.getIncomingWebhookByUrl(url).thenAccept(webhook->{
			try {
				WebhookMessageBuilder builder = Util.jsonToMessage(json);
				
				if(silent) {
					builder.setAllowedMentions(new AllowedMentionsBuilder().setMentionRoles(false).setMentionEveryoneAndHere(false).build());
				}
				builder.send(webhook).thenAccept(message->{
					if(message==null) {
						result.complete(true);
						return;
					}
					if(silent) {
						message.getApi().getThreadPool().getScheduler().schedule(()->{
							message.delete();
						}, 5, TimeUnit.MINUTES);
					}
					if(!silent&&publish) {
						message.crossPost();
					}
					result.complete(true);
				}).exceptionally(e->{
					if(e.getCause()!=null) {
						if(e.getCause() instanceof IllegalStateException) {
							result.complete(true);
							return null;
						}
					}
					System.out.println("Exception occured while executing message");
					e.printStackTrace();
					result.completeExceptionally(e);
					return null;
				});
			} catch (Exception e) {
				System.out.println("Exception occured while executing message");
				e.printStackTrace();
				result.completeExceptionally(e);
			}
		}).exceptionally(e->{
			System.out.println("Webhook no longer exists, we were unable to send the message");
			e.printStackTrace();
			result.completeExceptionally(e);
			return null;
		});
		return result;
	}
	
	public EmbedBuilder getDisplayInfo() {
		String editable;
		try {
			editable = Util.shortenHook(this.json);
		} catch (IOException e) {
			editable = null;
		}
		return new EmbedBuilder().addField("Where", this.channelMention).addField("When", "<t:"+(this.date.getTime()/1000+":f>")).addField("Message code", editable==null?"Sorry, couldn't make one!":editable);
	}
}
