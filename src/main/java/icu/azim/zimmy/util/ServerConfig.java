package icu.azim.zimmy.util;

import java.util.Optional;

import org.javacord.api.DiscordApi;
import org.javacord.api.entity.channel.ServerTextChannel;
import org.javacord.api.entity.permission.Role;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class ServerConfig{
	public Long role;
	public Long channel;
	public String timezone;
	public Long serverId;
	
	public ServerConfig(Long serverId, JedisPool jpool) {
		this.serverId = serverId;
		try (Jedis j = jpool.getResource()){
			String sid = "s:" + serverId;
			String role = j.get(sid+":role");
			if(role!=null) {
				this.role = Long.valueOf(role);
			}
			String channel = j.get(sid+":channel");
			if(channel!=null) {
				this.channel = Long.valueOf(channel);
			}
			timezone = j.get(sid+":timezone");
		}
	}

	public void setRole(Long role, JedisPool jpool) {
		this.role = role;
		try (Jedis j = jpool.getResource()){
			j.set("s:"+serverId+":role", role+"");
		}
	}
	public void setChannel(Long channel, JedisPool jpool) {
		this.channel = channel;
		try (Jedis j = jpool.getResource()){
			j.set("s:"+serverId+":channel", channel+"");
		}
	}
	public void setTimezone(String timezone, JedisPool jpool) {
		this.timezone = timezone;
		try (Jedis j = jpool.getResource()){
			j.set("s:"+serverId+":timezone", timezone);
		}
	}
	
	public String getRoleOrDefault(DiscordApi api) {
		if(role==null)return "`none`";
		Optional<Role> or = api.getRoleById(role);
		if(!or.isPresent())return "`none`";
		return or.get().getMentionTag();
	}
	
	public String getChannelOrDefault(DiscordApi api) {
		if(channel==null)return "`none`";
		Optional<ServerTextChannel> och = api.getServerTextChannelById(channel);
		if(!och.isPresent())return "`none`";
		return och.get().getMentionTag();
	}
	
	public String getTimezoneOrDefault() {
		return timezone==null?"GMT":timezone;
	}
}
