package icu.azim;

import icu.azim.zimmy.Zimmy;

public class EntryPoint {
	public static void main(String[] args) {
		System.setProperty("log4j2.formatMsgNoLookups", "true");

		new Zimmy();
	}

}
