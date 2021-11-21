package icu.azim.zimmy.util;

import java.util.Date;

import icu.azim.zimmy.util.payload.WebhookPayload;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.params.SetParams;

public class TempUtil {
	
	public static void put(String key, WebhookPayload payload, Jedis j) {
		key = "temp:"+key;
		
		j.set(key+":date", payload.date.getTime()+"", SetParams.setParams().ex(60*15));
		j.set(key+":url", payload.url, SetParams.setParams().ex(60*15));
		j.set(key+":data", payload.json, SetParams.setParams().ex(60*15));
		j.set(key+":mention", payload.channelMention, SetParams.setParams().ex(60*15));
		
	}
	
	public static WebhookPayload get(String key, Jedis j) {
		key = "temp:"+key;
		String date = j.get(key+":date");
		String url = j.get(key+":url");
		String data = j.get(key+":data");
		String mention = j.get(key+":mention");
		if(date==null||url==null||data==null||mention==null) {
			return null;
		}
		WebhookPayload result = new WebhookPayload(url, data);
		result.date = new Date(Long.valueOf(date));
		result.channelMention = mention;
		
		return result;
	}
}
