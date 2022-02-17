package icu.azim;

import org.springframework.boot.SpringApplication;

import icu.azim.dashboard.Dashboard;
import icu.azim.zimmy.Zimmy;

public class EntryPoint {
	public static void main(String[] args) {
		System.setProperty("log4j2.formatMsgNoLookups", "true");

		new Zimmy();
		SpringApplication.run(Dashboard.class, args);
	}
}
