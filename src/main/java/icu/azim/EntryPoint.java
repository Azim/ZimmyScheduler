package icu.azim;

import java.io.FileNotFoundException;
import java.util.Properties;

import org.springframework.boot.SpringApplication;

import icu.azim.dashboard.DashboardApplication;
import icu.azim.zimmy.BotConfig;
import icu.azim.zimmy.Zimmy;

@SuppressWarnings("unused")
public class EntryPoint {
	public static void main(String[] args) {
		System.setProperty("log4j2.formatMsgNoLookups", "true");

		BotConfig cfg;
		try {
			cfg = BotConfig.fromJson("config.json");
		} catch (FileNotFoundException e) {
			System.out.println("Error loading config file");
			e.printStackTrace();
			System.exit(10);
			return;
		}
		
		//new Zimmy(cfg);
		SpringApplication application = new SpringApplication(DashboardApplication.class);
		
        Properties properties = new Properties();
        properties.put("spring.security.oauth2.client.registration.discord.client-id", cfg.clientId);
        properties.put("spring.security.oauth2.client.registration.discord.client-secret", cfg.clientSecret);
        application.setDefaultProperties(properties);
        
		application.run(args);
	}
}
