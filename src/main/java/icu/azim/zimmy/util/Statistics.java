package icu.azim.zimmy.util;

import java.io.IOException;

import com.google.gson.JsonObject;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;

public class Statistics {
	private static final OkHttpClient client = new OkHttpClient();

	@SuppressWarnings("deprecation") //TODO get away from deprecated stuff?
	private static void sendPost(String endpoint, String token, String body) { 
		Request request = new Request.Builder().url(endpoint)
				.addHeader("Authorization", token)
				.addHeader("content-type", "application/json")
				.post(RequestBody.create(MediaType.parse("application/json; charset=utf-8"), body)).build();
		try {
			client.newCall(request).execute().close();
		} catch (IOException e) {
			System.out.println("Failed to post stats to discord.boats, Error: " + e.getMessage());
			e.printStackTrace();
		}
	}
	
	public static void sendTopGG(int count, String botid, String apiToken) {
		if(apiToken==null)return;
		String api = String.format("https://top.gg/api/bots/%s/stats", botid);
		JsonObject json = new JsonObject();
		json.addProperty("server_count", count);
		sendPost(api, apiToken, json.toString());
	}
	public static void sendDiscordExtremeList(int count, String botid, String apiToken) {
		if(apiToken==null)return;
		String api = String.format("https://api.discordextremelist.xyz/v2/bot/%s/stats", botid);
		JsonObject json = new JsonObject();
		json.addProperty("guildCount", count);
		sendPost(api, apiToken, json.toString());
	}
}
