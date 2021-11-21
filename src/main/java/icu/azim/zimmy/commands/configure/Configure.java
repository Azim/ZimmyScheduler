package icu.azim.zimmy.commands.configure;

import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import org.javacord.api.entity.message.embed.EmbedBuilder;
import org.javacord.api.entity.permission.PermissionType;
import org.javacord.api.entity.permission.PermissionsBuilder;
import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.event.interaction.SlashCommandCreateEvent;
import org.javacord.api.interaction.SlashCommandInteraction;
import org.javacord.api.interaction.SlashCommandInteractionOption;
import org.javacord.api.interaction.callback.InteractionCallbackDataFlag;
import org.javacord.api.interaction.callback.InteractionImmediateResponseBuilder;

import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.util.ServerConfig;
import pw.mihou.velen.interfaces.VelenArguments;
import pw.mihou.velen.interfaces.VelenSlashEvent;
import pw.mihou.velen.utils.VelenUtils;
import redis.clients.jedis.JedisPool;

public class Configure implements VelenSlashEvent {

	@Override
	public void onEvent(SlashCommandCreateEvent originalEvent, 
			SlashCommandInteraction event, 
			User user,
			VelenArguments vargs, 
			List<SlashCommandInteractionOption> options,
			InteractionImmediateResponseBuilder firstResponder) {
		Server server = event.getServer().orElseThrow();
		JedisPool jpool = Zimmy.getInstance().getPool();
		
		String type = options.get(0).getName();
		ServerConfig cfg = new ServerConfig(server.getId(), jpool);

		InteractionImmediateResponseBuilder responder = event.createImmediateResponder().setFlags(InteractionCallbackDataFlag.EPHEMERAL);
		switch(type) {
		case "auto":
			if(server.canYouManageRoles()&&server.canYouCreateChannels()) {
				server.createRoleBuilder().setName("ZimmySchedulerContoller").create().thenAccept(role->{
					user.addRole(role);
					event.getApi().getYourself().addRole(role);
					server.createTextChannelBuilder().setName("zimmy-bot")
					.addPermissionOverwrite(server.getEveryoneRole(), new PermissionsBuilder().setAllDenied().build())
					.addPermissionOverwrite(role, new PermissionsBuilder().setAllDenied().setAllowed(PermissionType.READ_MESSAGES, PermissionType.SEND_MESSAGES, PermissionType.EMBED_LINKS, PermissionType.READ_MESSAGE_HISTORY, PermissionType.ADD_REACTIONS, PermissionType.ATTACH_FILE, PermissionType.USE_EXTERNAL_EMOJIS).build())
					.addPermissionOverwrite(event.getApi().getYourself(), new PermissionsBuilder().setAllowed(PermissionType.MANAGE_WEBHOOKS).build())
					.create().thenAccept(channel->{
						channel.createWebhookBuilder().setName("Preview message").create().thenAccept(wh->{
							cfg.setChannel(channel.getId(), jpool);
							cfg.setRole(role.getId(), jpool);
							
							responder.setContent("Done!").respond();
							channel.sendMessage(user.getMentionTag()+"\n"+
									"I created this channel("+channel.getMentionTag()+"), this role("+role.getMentionTag()+") and this channel's webhook for you.\n"+
									"You can safely rename them and change the colors or location, but keep in mind that i will only check if user has this role to determine wether or not he can use my commands.");
						}).exceptionally(e->{
							cfg.setChannel(channel.getId(), jpool);
							cfg.setRole(role.getId(), jpool);
							responder.setContent("Unable to create webhook in this channel, please create it yourself.").respond();
							return null;
						});
					}).exceptionally(e->{
						responder.setContent("Unable to create channel, deleting freshly-created role("+role.getMentionTag()+").").respond();
						role.delete();
						return null;
					});
				}).exceptionally(e->{
					responder.setContent("Unable to create role.").respond();
					return null;
				});
			}else {
				responder.setContent("I need permissions to create/manage roles and channels to do that.").respond();
				return;
			}
			
			break;
		case "get":
			responder.addEmbed(new EmbedBuilder().setDescription(
							"Control role: "+cfg.getRoleOrDefault(event.getApi())+"\n"+
							"Control channel: "+cfg.getChannelOrDefault(event.getApi())+"\n"+
							"Timezone: `"+cfg.getTimezoneOrDefault()+"`"
							)).respond();
			break;
		case "set":
			List<SlashCommandInteractionOption> args = options.get(0).getOptions();
			String property = args.get(0).getStringValue().orElseThrow();
			String nvalue = args.get(1).getStringValue().orElseThrow();
			switch(property) {
			case "role":
				VelenUtils.getOrderedRoleMentions(user.getApi(), nvalue).stream().findFirst().ifPresentOrElse(role->{
					if(server.getId()!=role.getServer().getId()) {
						responder.setContent("This role is from different server, choose different role and try again.").respond();
						return;
					}
					cfg.setRole(role.getId(), jpool);
					responder.setContent("New control role is "+role.getMentionTag()).respond();
					return;
				}, ()->{ //no roles mentioned
					responder.setContent("Invalid role mention, try again.");
					return;
				});
				break;
			case "channel":
				VelenUtils.getOrderedChannelMentions(user.getApi(), nvalue).stream()
				.map(ch->ch.asServerTextChannel()).filter(ch->ch.isPresent()).map(ch->ch.get()).findFirst()
				.ifPresentOrElse(ch->{
					if(server.getId()!=ch.getServer().getId()) {
						responder.setContent("This channel is from different server, choose different one and try again.").respond();
						return;
					}
					cfg.setChannel(ch.getId(), jpool);
					responder.setContent("New control channel is "+ch.getMentionTag()).respond();
					return;
				}, ()->{ //no roles mentioned
					responder.setContent("Invalid channel mention, try again.");
					return;
				});
				
				break;
			case "timezone":
				TimeZone zone;
				if(!nvalue.toUpperCase().startsWith("GMT")) {
					responder.setContent("Invalid timezone.\nCorrect usage: `GMT+3`").respond();
					return;
				}else {
					zone = TimeZone.getTimeZone(nvalue);
				}
				cfg.setTimezone(zone.getID(), jpool);
				responder.setContent("New timezone is `"+zone.getDisplayName(Locale.ENGLISH)+"`").respond();
				break;
			}
			break;
		}
	}
}
