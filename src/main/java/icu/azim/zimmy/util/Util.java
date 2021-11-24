package icu.azim.zimmy.util;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import org.javacord.api.DiscordApi;
import org.javacord.api.entity.activity.ActivityType;
import org.javacord.api.entity.message.WebhookMessageBuilder;
import org.javacord.core.entity.message.embed.EmbedImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class Util {
	private static final OkHttpClient httpClient = new OkHttpClient();
	
	public static final Pattern shortDiscoHook = Pattern.compile("https?:\\/\\/share\\.discohook\\.app\\/go\\/[0-9a-z]+");
	public static final Pattern templateNameFormat = Pattern.compile("^[\\w-]{1,32}$"); 
	public static final String templateUrl = "https://via.placeholder.com/900x500.png?text=Placeholder+for+variable";
	public static final String dateTimeFormat = "dd.MM.yyyy HH:mm";
	public static final String dateFormat = "dd.MM.yyyy";
	public static final String timeRegex = "^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$";
	
	public static Map<TimeUnit,Long> computeDiff(Date date1, Date date2) {

		long diffInMillies = date2.getTime() - date1.getTime();

		//create the list
		List<TimeUnit> units = new ArrayList<TimeUnit>(EnumSet.allOf(TimeUnit.class));
		Collections.reverse(units);

		//create the result map of TimeUnit and difference
		Map<TimeUnit,Long> result = new LinkedHashMap<TimeUnit,Long>();
		long milliesRest = diffInMillies;

		for ( TimeUnit unit : units ) {

			//calculate difference in millisecond 
			long diff = unit.convert(milliesRest,TimeUnit.MILLISECONDS);
			long diffInMilliesForUnit = unit.toMillis(diff);
			milliesRest = milliesRest - diffInMilliesForUnit;

			//put the result in the map
			result.put(unit,diff);
		}

		return result;
	}

	public static String readableDiff(Date date1, Date date2) {
		Map<TimeUnit, Long> map = computeDiff(date1, date2);
		String result="";

		Long days = map.get(TimeUnit.DAYS);
		if(days>0)result+=(days+" days ");

		Long hours = map.get(TimeUnit.HOURS);
		if(hours>0)result+=(hours+" hours ");

		Long minutes = map.get(TimeUnit.MINUTES);
		if(minutes>0)result+=(minutes+" minutes");

		if(result.length()==0)result = "less than a minute";
		return result;
	}

	public static WebhookMessageBuilder jsonToMessage(String json) throws MalformedURLException {
		JsonObject jobj = new Gson().fromJson(json, JsonObject.class);
		WebhookMessageBuilder builder = new WebhookMessageBuilder();
		if(properHas(jobj,"content")) {
			builder.setContent(jobj.get("content").getAsString());
		}
		if(properHas(jobj,"username")) {
			builder.setDisplayName(jobj.get("username").getAsString());
		}
		if(properHas(jobj,"avatar_url")) {
			builder.setDisplayAvatar(new URL(jobj.get("avatar_url").getAsString()));
		}
		if(properHas(jobj,"tts")) {
			builder.setTts(jobj.get("tts").getAsBoolean());
		}
		if(properHas(jobj,"embeds")) {
			JsonArray embeds = jobj.get("embeds").getAsJsonArray();
			for(JsonElement el:embeds) {
				ObjectMapper mapper = new ObjectMapper();
			    try {
					JsonNode actualObj = mapper.readTree(el.toString());
					EmbedImpl impl = new EmbedImpl(actualObj);
					builder.addEmbed(impl.toBuilder());
				} catch (IOException ignored) {
					continue;
				}
			}
		}
		return builder;
	}
	
	public static boolean properHas(JsonObject obj, String piece) {
		if(obj.get(piece)==null)return false;
		if(obj.get(piece).isJsonNull())return false;
		return true;
	}
	
	@SuppressWarnings("deprecation")
	public static String shortenHook(String jsonIn) throws IOException{
		
		String encoded = Base64.getUrlEncoder().encodeToString(("{\n\"message\":"+jsonIn+"\n}").getBytes(StandardCharsets.UTF_8));
		String hookurl = "https://discohook.org/?message="+encoded;
		String body = "{\"url\":\""+hookurl+"\"}";
		
		Request request = new Request.Builder().url("https://share.discohook.app/create")
				.addHeader("Content-Type", "application/json;charset=UTF-8")
				.addHeader("User-Agent", "Zimmy-Bot-By-Azim")
				.post(RequestBody.create(MediaType.parse("application/json; charset=utf-8"), body)).build();
		Response result = httpClient.newCall(request).execute();
		
		String json = result.body().string();
		result.close();
		Gson gson = new Gson();
		JsonObject response = gson.fromJson(json, JsonObject.class);
		if(response.has("url")) {
			return response.get("url").getAsString();
		}else {
			return null;
		}
	}
	
	//https://regex101.com/r/cPiC2t/1
	public static String fromShortHook(String shortHook) throws IOException, IllegalArgumentException {
		Request request = new Request.Builder().url(shortHook)
				.addHeader("User-Agent", "Zimmy-Bot-By-Azim")
				.get().build();
		
		Response result = httpClient.newCall(request).execute();
		
		URL url = result.request().url().url();
		result.close();
		if(!url.getHost().equalsIgnoreCase("discohook.org")||!url.getPath().equals("/")) return null;
		String query = url.getQuery();
		if(query==null) return null;
		if(query.startsWith("message=")){
			String content = query.substring("message=".length());
			String decoded = new String(Base64.getUrlDecoder().decode(content),"UTF-8");
			Gson gson = new Gson();
			JsonObject answer = gson.fromJson(decoded, JsonObject.class);
			if(!answer.has("message")) {
				return null;
			}
			return answer.get("message").toString();
			
		}else if(query.startsWith("data=")) {
			String content = query.substring("data=".length());
			String decoded = new String(Base64.getUrlDecoder().decode(content),"UTF-8");
			Gson gson = new Gson();
			JsonObject answer = gson.fromJson(decoded, JsonObject.class);
			if(answer.has("messages")) {
				JsonArray messages = answer.get("messages").getAsJsonArray();
				if(messages==null) return null;
				if(messages.size()<1)return null;
				JsonObject msg = messages.get(0).getAsJsonObject();
				if(msg==null||!msg.has("data"))return null;
				return msg.get("data").toString();
			}else {
				return null;
			}
		}
		return null;
	}
	
	public static void updateWeather(DiscordApi api, String apiToken) throws IOException {
		Request request = new Request.Builder().url("http://api.openweathermap.org/data/2.5/weather?id=536203&appid="+apiToken)
				.addHeader("User-Agent", "Zimmy-Bot-By-Azim")
				.get().build();
		Response result = httpClient.newCall(request).execute();
		Gson gson = new Gson();
		JsonObject response = gson.fromJson(result.body().string(), JsonObject.class);
		result.close();
		JsonArray weather = response.get("weather").getAsJsonArray();
		JsonObject current = weather.get(0).getAsJsonObject();
		int code = current.get("id").getAsInt();
		String descr = current.get("description").getAsString().toLowerCase().split(":")[0];
		if(code<600) {
			api.updateActivity(ActivityType.LISTENING, descr);
		}else {
			api.updateActivity(ActivityType.WATCHING, descr);
		}
		
	}
}
