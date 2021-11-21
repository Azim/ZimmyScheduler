package icu.azim.zimmy.util.payload;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

import org.javacord.api.entity.message.WebhookMessageBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import icu.azim.zimmy.util.Util;
import icu.azim.zimmy.util.reimpl.TemplateEmbedImpl;
import redis.clients.jedis.Jedis;

public class TemplatePayload {
	/*
	 * [t:serverid:name:data] - json
	 * [t:serverid:name:properties] - properties
	 */
	
	public String data;
	public String name;

	public List<String> properties;
	
	
	public static TemplatePayload fromJedis(String name, String server, Jedis j) {
		String key = "t:"+server+":"+name;
		TemplatePayload result = new TemplatePayload();
		if(!j.exists(key+":data")) {
			return null;
		}
		result.name = name;
		result.data = j.get(key+":data");
		result.properties = j.lrange(key+":properties", 0, -1);
		
		return result;
	}
	
	public void saveToJedis(String server, Jedis j) {
		String key = "t:"+server+":"+this.name;
		j.set(key+":data", this.data);
		if(j.exists(key+":properties")) {
			j.del(key+":properties");
		}
		this.properties.forEach(property->{
			j.rpush(key+":properties", property);
		});
	}
	
	public WebhookMessageBuilder toMessage() throws MalformedURLException {
		JsonObject jobj = new Gson().fromJson(data, JsonObject.class);
		WebhookMessageBuilder builder = new WebhookMessageBuilder();
		if(Util.properHas(jobj,"content")) {
			builder.setContent(jobj.get("content").getAsString());
		}
		if(Util.properHas(jobj,"username")) {
			builder.setDisplayName(jobj.get("username").getAsString());
		}
		if(Util.properHas(jobj,"avatar_url")) {
			String avatarUrl = jobj.get("avatar_url").getAsString();
			if(properties.stream().anyMatch(p->avatarUrl.contains("%"+p+"%"))) {
				builder.setDisplayAvatar(new URL("https://via.placeholder.com/900x500.png?text=Placeholder+for+variable"));
			}else {
				builder.setDisplayAvatar(new URL(avatarUrl));
			}
		}
		if(Util.properHas(jobj,"tts")) {
			builder.setTts(jobj.get("tts").getAsBoolean());
		}
		if(Util.properHas(jobj,"embeds")) {
			JsonArray embeds = jobj.get("embeds").getAsJsonArray();
			for(JsonElement el:embeds) {
				ObjectMapper mapper = new ObjectMapper();
			    try {
					JsonNode actualObj = mapper.readTree(el.toString());
					TemplateEmbedImpl impl = new TemplateEmbedImpl(actualObj);
					builder.addEmbed(impl.toBuilder());
				} catch (IOException ignored) {
					continue;
				}
			}
		}
		//
		return builder;
	}
	
}
