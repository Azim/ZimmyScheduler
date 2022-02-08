package icu.azim.zimmy;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.time.Duration;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import org.javacord.api.DiscordApi;
import org.javacord.api.DiscordApiBuilder;
import org.javacord.api.entity.activity.ActivityType;
import org.javacord.api.entity.channel.TextChannel;
import org.javacord.api.entity.intent.Intent;
import org.javacord.api.entity.permission.PermissionType;
import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.javacord.api.interaction.SlashCommandOption;
import org.javacord.api.interaction.SlashCommandOptionChoice;
import org.javacord.api.interaction.SlashCommandOptionType;
import org.quartz.JobBuilder;
import org.quartz.JobDetail;
import org.quartz.JobKey;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.impl.StdSchedulerFactory;

import icu.azim.zimmy.commands.configure.Configure;
import icu.azim.zimmy.commands.edit.Edit;
import icu.azim.zimmy.commands.edit.EditConfirmButton;
import icu.azim.zimmy.commands.help.Help;
import icu.azim.zimmy.commands.planned.DeleteButtons;
import icu.azim.zimmy.commands.planned.Planned;
import icu.azim.zimmy.commands.planned.PlannedButtons;
import icu.azim.zimmy.commands.repeat.Repeat;
import icu.azim.zimmy.commands.schedule.Schedule;
import icu.azim.zimmy.commands.schedule.ScheduleButtons;
import icu.azim.zimmy.commands.template.Template;
import icu.azim.zimmy.commands.template.TemplateUse;
import icu.azim.zimmy.quartz.SendJob;
import icu.azim.zimmy.util.ServerUtil;
import icu.azim.zimmy.util.Statistics;
import icu.azim.zimmy.util.Util;
import icu.azim.zimmy.util.payload.TemplatePayload;
import it.burning.cron.CronExpressionDescriptor;
import pw.mihou.velen.interfaces.Velen;
import pw.mihou.velen.interfaces.VelenCommand;
import pw.mihou.velen.internals.observer.VelenObserver;
import pw.mihou.velen.internals.observer.modes.ObserverMode;
import pw.mihou.velen.utils.VelenBotInviteBuilder;
import pw.mihou.velen.utils.invitebuilder.InviteScope;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.exceptions.JedisConnectionException;


public class Zimmy {
	/* //debug go brrrrrr
	static
	{
	     FallbackLoggerConfiguration.setDebug(true);
	     FallbackLoggerConfiguration.setTrace(true);
	}
	*/
	private static Zimmy instance;
	public static Zimmy getInstance() {
		return instance;
	}
	
	public DiscordApi api;
	public Velen velen;
	public VelenObserver observer;
	private TemplateUse templateHandler;
	public TextChannel mainChannel;
	
	public Scheduler scheduler;
	
	public boolean isDebug;

	private JedisPool jedisPool;
	public JedisPool getPool() {
		return jedisPool;
	}
	
	/**TODO Data structure
	 * [s:ID:prefix]		- string [deprecated]
	 * [s:ID:role]			- long
	 * [s:ID:channel]		- long
	 * [s:ID:timezone]		- string
	 * [s:ID:planned] 		- List<long>
	 * [s:ID:notifications]	- string (enum)
	 * 
	 * [e:lastId] 			- long
	 * 
	 * [e:sendAt:TIME] 		- List<long>
	 * [e:ID:url] 			- string  (url)
	 * [e:ID:data] 			- string (json)
	 * [e:ID:date]			- date
	 * [e:ID:mention]		- string
	 * [e:ID:server]		- long
	 * [e:ID:r:type]		- string
	 * [e:ID:r:pattern]		- string
	 * 
	 * [t:serverid:name:data] - json
	 * [t:serverid:name:properties] - properties
	 */
	
	
	
	public Zimmy() {
		instance = this;
		
		BotConfig cfg;
		
		isDebug = System.getenv().containsKey("testing");
		System.out.println(isDebug?"isDebug":"isntDebug");
		if(isDebug) { 
			cfg = BotConfig.fromEnv();
		}else {
			try {
				cfg = BotConfig.fromJson("config.json");
			} catch (FileNotFoundException e) {
				System.out.println("Error loading config file");
				e.printStackTrace();
				System.exit(10);
				return;
			}
		}
		System.out.println("Got config");
		
		if(cfg.token==null||cfg.channelId==null||cfg.token.isEmpty()||cfg.channelId.isEmpty()) {
			System.out.println("Either token or main channel env variables are missing, shutting down");
			System.exit(1);
			return;
		}
		
		jedisPool = getPool(cfg.redisHost, cfg.redisPort, cfg.redispw);
		try(Jedis j = jedisPool.getResource()){
			j.select(isDebug?1:0);
		}catch(JedisConnectionException e) {
			e.printStackTrace();
			System.exit(3);
			return;
		}
		System.out.println("Got redis");
		
		api = new DiscordApiBuilder()
				.setToken(cfg.token)
				.setIntents(Intent.GUILDS, /*Intent.GUILD_MEMBERS,*/ Intent.GUILD_WEBHOOKS, Intent.GUILD_MESSAGES, Intent.GUILD_MESSAGE_REACTIONS, Intent.GUILD_EMOJIS)
				.setWaitForUsersOnStartup(false)
				.login().exceptionally(e->{
			e.printStackTrace();
			System.exit(4);
			return null;
		}).join();

		System.out.println("Logged in bot");
		System.out.println("You can invite bot using this url: "+new VelenBotInviteBuilder(api.getClientId())
				.addScopes(InviteScope.APPLICATIONS_COMMANDS, InviteScope.BOT)
				.setPermissions(PermissionType.MANAGE_ROLES, PermissionType.MANAGE_CHANNELS, PermissionType.MANAGE_WEBHOOKS, PermissionType.READ_MESSAGES, PermissionType.SEND_MESSAGES, PermissionType.EMBED_LINKS, PermissionType.ATTACH_FILE, PermissionType.READ_MESSAGE_HISTORY, PermissionType.USE_EXTERNAL_EMOJIS, PermissionType.ADD_REACTIONS, PermissionType.USE_APPLICATION_COMMANDS)
				.create()
				);
		
		velen = Velen.builder()
				.setDefaultCooldownTime(Duration.ZERO)
				.build();
		api.addListener(velen);
		templateHandler = new TemplateUse();
		registerCommands();
		observer = new VelenObserver(api, ObserverMode.MASTER);
		observer.observe(velen);
		loadTemplateCommands();
		velen.index(api).join();
		
		System.out.println("Loaded velen");
		
		startQuartz(cfg.qHost, cfg.qUser, cfg.qPassword);

		System.out.println("Started quartz");
		
		Collection<Server> servers = api.getServers();
		System.out.println(servers.size()+" servers");
		
		Optional<TextChannel> channel = api.getTextChannelById(cfg.channelId);
		if(!channel.isPresent()) {
			System.out.println("Main channel ("+cfg.channelId+") not found, shutting down");
			System.exit(2);
			return;
		}

		System.out.println("Got main channel");
		
		mainChannel = channel.get();
		api.addServerJoinListener(event->{
			mainChannel.sendMessage("Joined server `"+event.getServer().getName()+"` ("+event.getServer().getMemberCount()+" members)");
			try(Jedis j = jedisPool.getResource()){
				String rid = j.get("s:"+event.getServer().getId()+":role");
				api.getRoleById(rid).ifPresent(r->{
					r.addUser(api.getYourself());
				});
			}
			//TODO start all planned messsages if there are any
		});
		api.addServerLeaveListener(event->{
			mainChannel.sendMessage("Left server `"+event.getServer().getName()+"` ("+event.getServer().getMemberCount()+" members)");
			//TODO stop all planned messages from being sent?
		});
		api.updateActivity(ActivityType.WATCHING, "booting up.");

		setupStats(api, cfg.topggToken);
		
		mainChannel.sendMessage("Bot sucessfully started");
		try(Jedis j = getPool().getResource()){
			String message = "";
			for(Server server:api.getServers()) {
				long size = j.llen("s:"+server.getId()+":planned");
				String row = String.format("`%s`(`%s`) - %d members (%d posts planned)", server.getName(), server.getIdAsString(), server.getMemberCount(), size);
				if(message.length()+row.length()>=2000) {
					mainChannel.sendMessage(message);
					message = row;
				}else {
					message += (message.length()>0 ? "\n"+row : row);
				}
			}
			mainChannel.sendMessage(message);
		}
		mainChannel.sendMessage("Total servers: "+api.getServers().size());
		
		//velen.registerAllSlashCommands(api).exceptionally(ExceptionLogger.get()).join();
		setupWeather(api, cfg.weatherToken);
		//checkStuff();
	}

	private void startQuartz(String quartzUrl, String quartzUser, String quartzPassword) {
		Properties props = new Properties();
		try {
			props.load(Zimmy.class.getClassLoader().getResourceAsStream("quartz.properties"));
		} catch (IOException e) {
			e.printStackTrace();
			System.exit(5);
			return;
		}
		props.put("org.quartz.dataSource.quartzDS.URL", quartzUrl);
		props.put("org.quartz.dataSource.quartzDS.user", quartzUser);
		props.put("org.quartz.dataSource.quartzDS.password", quartzPassword);
		
		try {
			SchedulerFactory schFactory = new StdSchedulerFactory(props);

			scheduler = schFactory.getScheduler();
			scheduler.start();
			
			if(!scheduler.checkExists(new JobKey("send"))){
				JobDetail job = JobBuilder.newJob(SendJob.class).withIdentity("send").storeDurably(true).build();
				scheduler.addJob(job, false); // one job is all we need, many triggers will fire it instead
			}
		} catch (SchedulerException e) {
			e.printStackTrace();
			System.exit(6);
			return;
		}
		
		CronExpressionDescriptor.setDefaultLocale("en");
	}
	
	private void registerCommands() {
		velen.addSlashMiddleware("server check",
				(event, command, gate) -> {
					if(event.getInteraction().getServer().isEmpty()) {
						return gate.deny("You can only use this command in servers.");
					}
					return gate.allow();
            });
		velen.addSlashMiddleware("permission check",
				(event, command, gate) -> {
					User user = event.getSlashCommandInteraction().getUser();
					TextChannel channel = event.getSlashCommandInteraction().getChannel().orElseThrow();
					
					if(ServerUtil.canUse(event, jedisPool)) {
						return gate.allow();
					}
					
					if(ServerUtil.canUseByRole(user, channel.asServerChannel().get().getServer(), jedisPool)) {
						return gate.deny("You can't use this command in this channel.");
					}else {
						return gate.deny("You can't use this command.");
					}
            });
		velen.addSlashMiddleware("admin check",
				(event, command, gate) -> {
					User user = event.getSlashCommandInteraction().getUser();
					Server server = event.getSlashCommandInteraction().getServer().orElseThrow();
					if(server.isAdmin(user)) {
						return gate.allow();
					}
					return gate.deny("Only server administrators can use this command.");
            });
		velen.addSlashMiddleware("configuration check",
				(event, command, gate) -> {
					Server server = event.getSlashCommandInteraction().getServer().get();
					if(!ServerUtil.isServerConfigured(server, getPool())) {
						return gate.deny("Before anyone can use this command, server administrator needs to configure the bot (see `/configure`).");
					}
					return gate.allow();
            });
		
		
		VelenCommand.ofSlash("schedule", "Schedule a message", velen, new Schedule())
			.addMiddlewares("server check", "configuration check", "permission check")
			.addOptions(
					SlashCommandOption.createWithOptions(
							SlashCommandOptionType.SUB_COMMAND, "channel", "You are scheduling message to the channel in this server",
							Arrays.asList(
									SlashCommandOption.create(SlashCommandOptionType.CHANNEL, "channel_mention", "The channel to send message to", true),
									SlashCommandOption.create(SlashCommandOptionType.STRING, "discohook_url", "Discohook message url", true),
									SlashCommandOption.create(SlashCommandOptionType.STRING, "datetime", "When to send message (`dd.MM.yyyy HH:mm` or `HH:mm`)", true))),
					SlashCommandOption.createWithOptions(
							SlashCommandOptionType.SUB_COMMAND, "webhook", "Schedule a message to any webhook",
							Arrays.asList(
									SlashCommandOption.create(SlashCommandOptionType.STRING, "webhook_url", "The webhook to send message to", true),
									SlashCommandOption.create(SlashCommandOptionType.STRING, "discohook_url", "Discohook message url", true),
									SlashCommandOption.create(SlashCommandOptionType.STRING, "datetime", "When to send message (`dd.MM.yyyy HH:mm` or `HH:mm`)", true))))
			.attach();
		api.addMessageComponentCreateListener(new ScheduleButtons());
		
		
		VelenCommand.ofSlash("planned", "Show currently planned messages", velen, new Planned())
			.addMiddlewares("server check", "configuration check", "permission check")
			.attach();
		api.addMessageComponentCreateListener(new PlannedButtons());
		api.addMessageComponentCreateListener(new DeleteButtons());
		
		
		VelenCommand.ofSlash("edit", "Edit planned message", velen, new Edit())
			.addMiddlewares("server check", "configuration check", "permission check")
			.addOptions(
					SlashCommandOption.create(SlashCommandOptionType.LONG, "id", "id of the message you want to edit", true),
					SlashCommandOption.createWithChoices(SlashCommandOptionType.STRING, "property", "Which property of planned message do you want to edit?", true, Arrays.asList(
							SlashCommandOptionChoice.create("destination", "destination"),
							SlashCommandOptionChoice.create("discohook_url", "discohook_url"),
							SlashCommandOptionChoice.create("datetime", "datetime"))),
					SlashCommandOption.create(SlashCommandOptionType.STRING, "new_value", "New value of the property", true))
			.attach();
		api.addMessageComponentCreateListener(new EditConfirmButton());
		
		
		VelenCommand.ofSlash("configure", "Configure bot for this server", velen, new Configure())
			.addMiddlewares("server check", "admin check")
			.addOptions(
					SlashCommandOption.create(SlashCommandOptionType.SUB_COMMAND, "auto", "Automatically generates needed channel and role."),
					SlashCommandOption.create(SlashCommandOptionType.SUB_COMMAND, "get", "Get current bot settings"),
					SlashCommandOption.createWithOptions(SlashCommandOptionType.SUB_COMMAND, "set", "Change bot settings", Arrays.asList(
							SlashCommandOption.createWithChoices(SlashCommandOptionType.STRING, "property", "Which bot setting do you want to change?", true, Arrays.asList(
									SlashCommandOptionChoice.create("role", "role"),
									SlashCommandOptionChoice.create("channel", "channel"),
									SlashCommandOptionChoice.create("timzeone", "timezone"),
									SlashCommandOptionChoice.create("notifications", "notifications"))),
							SlashCommandOption.create(SlashCommandOptionType.STRING, "new_value", "New value of the property", true)))
					)
			.attach();

		
		VelenCommand.ofSlash("help", "Show something helpful maybe", velen, new Help())
			.attach();
		
		
		VelenCommand.ofSlash("template", "manage templates", velen, new Template())
			.addMiddlewares("server check", "configuration check", "permission check")
			.addOptions(
					SlashCommandOption.createWithOptions(SlashCommandOptionType.SUB_COMMAND, "create", "Create new template", Arrays.asList(
							SlashCommandOption.create(SlashCommandOptionType.STRING, "name", "Name of template", true),
							SlashCommandOption.create(SlashCommandOptionType.STRING, "discohook_url", "Discohook message url", true),
							SlashCommandOption.create(SlashCommandOptionType.STRING, "variables", "Variables used in template, separated by comma (,)", false)
							)),
					
					SlashCommandOption.create(SlashCommandOptionType.SUB_COMMAND, "list", "Show existing templates"),
					
					SlashCommandOption.createWithOptions(SlashCommandOptionType.SUB_COMMAND, "edit", "Edit a template", Arrays.asList(
							SlashCommandOption.create(SlashCommandOptionType.STRING, "name", "name of the template you want to edit", true),
							SlashCommandOption.createWithChoices(SlashCommandOptionType.STRING, "property", "Which property of the template do you want to edit?", true, Arrays.asList(
									SlashCommandOptionChoice.create("name", "name"),
									SlashCommandOptionChoice.create("discohook_url", "discohook_url"),
									SlashCommandOptionChoice.create("variables", "variables"))),
							SlashCommandOption.create(SlashCommandOptionType.STRING, "new_value", "New value of the property", true))),
					
					SlashCommandOption.createWithOptions(SlashCommandOptionType.SUB_COMMAND, "delete", "Delete a template", Arrays.asList(
							SlashCommandOption.create(SlashCommandOptionType.STRING, "name", "Name of the template to delete", true)
							))
					)
			.attach();
		
		
		VelenCommand.ofSlash("repeat", "Make message be sent repeatedly after it's planned date on given schedule", velen, new Repeat())
			.addMiddlewares("server check", "configuration check", "permission check")
			.addOptions(
					SlashCommandOption.create(SlashCommandOptionType.LONG, "id", "id of the message you want to repeat", true),
					SlashCommandOption.createWithChoices(SlashCommandOptionType.STRING, "type", "Type of the repeat schedule to use", true, Arrays.asList(
							SlashCommandOptionChoice.create("cron", "cron"),
							SlashCommandOptionChoice.create("minutes", "minutes"))),
					SlashCommandOption.create(SlashCommandOptionType.STRING, "expression", "Expression of repeat schedule", true)
					)
			.attach();
	}
	
	private void setupStats(DiscordApi api, String token) {
		String botid = api.getYourself().getIdAsString();
		if(token==null) System.out.println("topggToken not defined, not sending top.gg stats");
		
		api.getThreadPool().getScheduler().scheduleAtFixedRate(()->{
			int count = api.getServers().size();
			Statistics.sendTopGG(count, botid, token);
			
		}, 5, 45, TimeUnit.MINUTES);
	}
	
	private void setupWeather(DiscordApi api, String token) {
		if(token==null) {
			System.out.println("No weather token provided");
			api.updateActivity(ActivityType.PLAYING, "with fire");
			return;
		}
		api.getThreadPool().getScheduler().scheduleAtFixedRate(()->{
			try {
				Util.updateWeather(api, token);
			} catch (IOException e) {
				System.out.println("Unable to get weather lel");
				e.printStackTrace();
			}
		}, 0, 2, TimeUnit.HOURS);
	}

	private static JedisPool getPool(String host, int port, String password) {
	    JedisPoolConfig config = new JedisPoolConfig();
	    config.setMaxTotal(100);
	    config.setMinIdle(5);
	    return new JedisPool(config, host, port, 5000, password);
	}

	private void loadTemplateCommands() {
		try(Jedis j = jedisPool.getResource()){
			for(Server s:api.getServers()) {
				updateTemplateCommand(s, j);
				syncServerCommands(s);
			}
		}
	}
	
	public void updateTemplateCommand(Server server, Jedis j) {
		velen.getCommand("template", server.getId()).ifPresent(cmd->{
			velen.removeCommand(cmd);
		});
		List<SlashCommandOption> subcommands = j.keys("t:"+server.getIdAsString()+":*:data").stream().map(key->{
			//System.out.println("Command "+key.split(":")[2]+" : "+server.getId()+ ":"+server.getIdAsString());
			return TemplatePayload.fromJedis(key.split(":")[2], server.getIdAsString(),j);
		}).filter(t->t!=null).map(template->createTemplateSubcommand(template)).toList();
		
		VelenCommand.ofSlash("template", "Manage templates", velen, templateHandler) 
			.addOptions(SlashCommandOption.createWithOptions(SlashCommandOptionType.SUB_COMMAND_GROUP, "use", "Use saved template", subcommands))
			.addMiddlewares("server check", "configuration check", "permission check")
			.setServerOnly(true, server.getId())
			.attach();
	}
	
	private SlashCommandOption createTemplateSubcommand(TemplatePayload template) {
		List<SlashCommandOption> properties = template.properties.stream()
				.map(property->SlashCommandOption.create(SlashCommandOptionType.STRING, property, "Property \""+property+"\"", true)).toList();
		
		return SlashCommandOption.createWithOptions(
						SlashCommandOptionType.SUB_COMMAND, template.name, "Using template \""+template.name+"\"", Stream.concat( Arrays.asList(
								SlashCommandOption.create(SlashCommandOptionType.STRING, "destination", "Where to send message to (webhook url or channel mention)", true),
								SlashCommandOption.create(SlashCommandOptionType.STRING, "datetime", "When to send message (\"dd.MM.yyyy HH:mm\" or \"HH:mm\")", true)
								).stream(), properties.stream()).toList());
	}
	public void syncServerCommands(Server server) {
		observer.observeServer(velen, server);
	}
	
	public void syncServerCommands() {
		observer.observeAllServers(velen, api);
	}
}
