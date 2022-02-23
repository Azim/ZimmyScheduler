package icu.azim.dashboard.util;

import java.io.IOException;
import java.util.Optional;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class DUtil {
	private static final OkHttpClient client = new OkHttpClient();
	
	public static Optional<JsonObject> getUserByToken(String token) {
		Request request = new Request.Builder()
				.addHeader("Authorization", "Bearer "+token)
				.url("https://discordapp.com/api/users/@me")
				.build();
		try {
			Response response = client.newCall(request).execute();
			if (response.isSuccessful()) {
				Gson gson = new Gson();
				JsonObject res = gson.fromJson(response.body().string(), JsonObject.class);
				response.close();
				return Optional.of(res);
			}
		} catch (IOException ignored) { }

		return Optional.empty();
	}

	public static Optional<JsonArray> getUserGuildsByToken(String token) {
		Request request = new Request.Builder()
				.addHeader("Authorization", "Bearer "+token)
				.url("https://discordapp.com/api/users/@me/guilds")
				.build();
		try {
			Response response = client.newCall(request).execute();
			if (response.isSuccessful()) {
				Gson gson = new Gson();
				JsonArray res = gson.fromJson(response.body().string(), JsonArray.class);
				response.close();
				return Optional.of(res);
			}
		} catch (IOException ignored) { }

		return Optional.empty();
	}
	
}
