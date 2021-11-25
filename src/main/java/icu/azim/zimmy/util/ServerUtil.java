package icu.azim.zimmy.util;

import java.util.ArrayList;
import java.util.Date;
import java.util.concurrent.CompletableFuture;

import org.javacord.api.DiscordApi;
import org.javacord.api.entity.channel.TextChannel;
import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.core.util.rest.RestEndpoint;
import org.javacord.core.util.rest.RestMethod;
import org.javacord.core.util.rest.RestRequest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import icu.azim.zimmy.util.payload.WebhookPayload;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class ServerUtil {
	
	public static boolean canUse(User user, Server server, TextChannel channel, JedisPool jpool) {
		try (Jedis j = jpool.getResource()){
			
			String schannelid = j.get("s:"+server.getId()+":channel");
			if(schannelid == null) {
				return false;
			}
			Long channelid = Long.valueOf(schannelid);
			if(channelid == null) {
				return false;
			}
			if(channel.getId()!=channelid) {
				return false; //wrong channel
			}
			
			if(server.isAdmin(user)) return true;
			
			String sroleid = j.get("s:"+server.getId()+":role");
			if(sroleid == null) {
				return server.isAdmin(user);
			}
			return canUseByRole(user, server, jpool);
		}
	}
	
	public static boolean canUse(SlashCommandCreateEvent e, JedisPool jpool) {
		SlashCommandInteraction interaction = e.getSlashCommandInteraction();
		
		if(interaction.getServer().isPresent()) {
			return canUse(interaction.getUser(), interaction.getServer().get(), interaction.getChannel().get(), jpool);
		}else {
			return false;
		}
	}
	
	public static boolean canUseByRole(User user, Server server, JedisPool jpool) {
		if (server.isAdmin(user))
			return true;

		try (Jedis j = jpool.getResource()) {
			String sroleid = j.get("s:" + server.getId() + ":role");
			if (sroleid == null) return false;
				
			return hasUserRole(user.getApi(), server.getIdAsString(), user.getIdAsString(), sroleid).join();
		}
	}
	
	public static CompletableFuture<JsonNode> getServerMember(DiscordApi api, String serverId, String userId) {
		return new RestRequest<JsonNode>(api, RestMethod.GET, RestEndpoint.SERVER_MEMBER)
				.setUrlParameters(serverId, userId)
				.execute(result-> result.getJsonBody());
	}
	
	public static CompletableFuture<Boolean> hasUserRole(DiscordApi api, String serverId, String userId, String roleId){
		return getServerMember(api, serverId, userId).thenApply(result->{
			@SuppressWarnings("unchecked")
			ArrayList<String> roles = new ObjectMapper().convertValue(result.get("roles"), ArrayList.class);
			return roles.stream().anyMatch(role->role.equalsIgnoreCase(roleId));
		});
	}
	
	public static boolean isServerConfigured(Server server, JedisPool jpool) {
		String serverId = server.getIdAsString();
		try (Jedis j = jpool.getResource()){
			String role = j.get("s:" + serverId + ":role");
			if(role==null)return false;

			String channel = j.get("s:" + serverId + ":role");
			if(channel==null)return false;
			return true;
		}
	}
	/**TODO Data structure
	 * [s:ID:prefix]		- string [deprecated]
	 * [s:ID:role]			- long
	 * [s:ID:channel]		- long
	 * [s:ID:timezone]		- string
	 * [s:ID:planned] 		- List<long>
	 * 
	 * [e:lastId] 			- long
	 * 
	 * [e:sendAt:TIME] 		- List<long>
	 * [e:ID:url] 			- string  (url)
	 * [e:ID:data] 			- string (json)
	 * [e:ID:date]			- date
	 * [e:ID:mention]		- string
	 * [e:ID:server]		- long
	 * [e:ID:repeat]		- long (repeat interval in millis)
	 * 
	 */
	public static long saveTask(WebhookPayload data, Date date, Long server, JedisPool jpool) {
		try (Jedis j = jpool.getResource()){
			String lastid = j.get("e:lastId");
			if(lastid == null) {
				j.set("e:lastId", "0");
			}
			Long id = j.incr("e:lastId");
			String eid = "e:"+id;
			j.set(eid+":url", data.url);
			j.set(eid+":data", data.json);
			j.set(eid+":date", date.getTime()+"");
			if(data.channelMention!=null&&data.channelMention.length()>1) {
				j.set(eid+":mention", data.channelMention);
			}
			j.set(eid+":server", server+"");
			
			j.rpush("e:sendAt:"+date.getTime(), id+"");
			j.rpush("s:"+server+":planned", id+"");
			
			return id;
		}
	}
	
	public static void removeTask(String eid, JedisPool jpool) {
		try(Jedis j = jpool.getResource()){
			removeTask(eid, j);
		}
	}
	
	public static void removeTask(String id, Jedis j) {
		String eid = "e:"+id;
		if(!j.exists(eid+":url"))return;
		String date = j.get(eid+":date");
		String server = j.get(eid+":server");

		j.lrem("s:"+server+":planned", 0, id);
		j.lrem("e:sendAt:"+date, 0, id);
		if(j.llen("e:sendAt:"+date)<1) {
			j.del("e:sendAt:"+date);
		}
		j.del(eid+":url", eid+":data", eid+":date", eid+":mention", eid+":server", eid+":cron");
	}
	
	public static void editTaskDate(String id, Date date, Jedis j) {
		String sdate = j.getSet("e:"+id+":date", date.getTime()+"");
		j.lrem("e:sendAt:"+sdate, 0, id);
		if(j.llen("e:sendAt:"+sdate)<1) {
			j.del("e:sendAt:"+sdate);
		}
		j.rpush("e:sendAt:"+date.getTime(), id);
	}
}
