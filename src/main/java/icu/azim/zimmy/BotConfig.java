package icu.azim.zimmy;

import java.io.FileNotFoundException;
import java.io.FileReader;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;

public class BotConfig {
	public String token;
	public String channelId;
	
	public String redisHost;
	public int redisPort;
	public String redispw;
	
	public String qHost, qUser, qPassword;
	
	public String weatherToken, topggToken, dellyToken;
	
	public static BotConfig fromEnv() {
		BotConfig cfg = new BotConfig();
		cfg.token = System.getenv("token");
		cfg.channelId = System.getenv("channel");
		
		cfg.redisHost = System.getenv().getOrDefault("host", "localhost");
		cfg.redisPort = Integer.valueOf(System.getenv().getOrDefault("port", "6379"));
		cfg.redispw = System.getenv().getOrDefault("redispw", "redispw");
		
		cfg.qHost = System.getenv().getOrDefault("qhost", "jdbc:mysql://localhost:3306/quartz");
		cfg.qUser = System.getenv().getOrDefault("quser", "quartz");
		cfg.qPassword = System.getenv().getOrDefault("qpassword", "qpassword");
		
		cfg.topggToken = System.getenv("topggToken");
		cfg.weatherToken = System.getenv("weatherToken");
		cfg.dellyToken = System.getenv("dellyToken");
		
		return cfg;
	}
	
	public static BotConfig fromJson(String filename) throws FileNotFoundException {
		Gson gson = new Gson();
		JsonReader reader = new JsonReader(new FileReader(filename));
		return gson.fromJson(reader, BotConfig.class);
	}
}
