package icu.azim.dashboard;

import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.javacord.api.entity.server.Server;
import org.javacord.api.entity.user.User;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.avatar.Avatar;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.details.Details;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.AnchorTarget;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Hr;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.FlexComponent.Alignment;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import icu.azim.dashboard.util.DUtil;
import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.quartz.CronUtil;
import icu.azim.zimmy.util.ServerUtil;
import redis.clients.jedis.Jedis;

@SuppressWarnings("serial")
@Route("")
@AnonymousAllowed
public class DashboardView extends AppLayout{
    private final OAuth2AuthorizedClientService clientService;
    private Optional<JsonObject> currentUser; //TODO wrapper object with no optional
    private Optional<JsonArray> currentUserGuilds;
    
	public DashboardView(OAuth2AuthorizedClientService clientService) {
		this.clientService = clientService;
		
		if(isAuthorized()) {
			OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
	        OAuth2AuthorizedClient client = this.clientService.loadAuthorizedClient(token.getAuthorizedClientRegistrationId(), token.getName());
	        String accessToken = client.getAccessToken().getTokenValue();
	        currentUser = DUtil.getUserByToken(accessToken);
	        currentUserGuilds = DUtil.getUserGuildsByToken(accessToken);
		}else {
			currentUser = Optional.empty();
			currentUserGuilds = Optional.empty();
		}
		addToNavbar(buildNavbar());
		setContent(buildAbout()); //TODO some static components?
		
	}
	
	
	
	private boolean isAuthorized() {
		return (SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken);
	}
	
	private Tabs getTabs() {
		Tab about = new Tab("About");
		Tab schedule = new Tab("Schedule");
		schedule.setEnabled(false);//TODO
		Tab planned = new Tab("Planned posts");
		planned.setEnabled(isAuthorized());
		Tab templates = new Tab("Templates");
		templates.setEnabled(false);//TODO 
		
		Tabs tabs = new Tabs(true, about, schedule, templates, planned);
		tabs.setWidthFull();
		tabs.addSelectedChangeListener(event->{
			//TODO tab changed, set different content
			switch(event.getSelectedTab().getLabel()) {
			case "About":
				setContent(buildAbout());
				break;
			case "Schedule":
				//TODO
				break;
			case "Planned posts":
				setContent(buildPlanned());
				break;
			case "Templates":
				//TODO
				break;
			default:
				
				break;
			}
		});
		return tabs;
	}
	
	private Component buildAbout() {
		VerticalLayout root = new VerticalLayout();
		root.setAlignItems(Alignment.START);
		root.add(
			new H3("Zimmy the discord message scheduler"),
			new Span("A simple bot to plan/schedule webhook messages, including repeating ones (via cron or set time period)"),
			new Span("Now with dashboard! Same functionality, but in more convenient format! Probably!"),
			new HorizontalLayout(
					a("Invite link", "https://discord.com/oauth2/authorize?client_id=721752791512776806&permissions=805424208&scope=bot%20applications.commands&prompt=consent"),
					a("Privacy policy", "https://gist.github.com/Azim/4bbccc2ca0206cf2c840740253f65c14"),
					a("Github repository", "https://github.com/Azim/ZimmyScheduler"),
					a("our Discord server", "https://discord.gg/nBjSGa4"),
					a("Donation page", "https://en.liberapay.com/Azim0ff/")
				),
			new HorizontalLayout(
					a("Discohook", "https://discohook.app/"),
					a("Cron tutorial", "https://www.freeformatter.com/cron-expression-generator-quartz.html#cronexpressionexamples")
				)
		);
		
		return root;
	}
	
	private Component a(String text, String url) {
		Anchor anchor = new Anchor(url, new Button(text));
		anchor.setTarget(AnchorTarget.BLANK);
		return anchor;
	}
	
	private Component buildPlanned() {
		VerticalLayout root = new VerticalLayout();
		root.setWidthFull();
		
		if(!isAuthorized()||currentUser.isEmpty()||currentUserGuilds.isEmpty()) return root;
		String userId = currentUser.get().get("id").getAsString();
		//TODO loading bar and async building of this all instead of join
		User user = Zimmy.getInstance().api.getUserById(userId).join();
		Collection<Server> botServers = Zimmy.getInstance().api.getServers();
		Set<Server> mutualServers = new HashSet<>();
		for(JsonElement el : currentUserGuilds.get()) {
			JsonObject server = el.getAsJsonObject();
			Long id = server.get("id").getAsLong();
			botServers.stream().filter(s->(s.getId()==id)).findAny().ifPresent(s->mutualServers.add(s));
		}
		
		
		
		try(Jedis j = Zimmy.getInstance().getPool().getResource()){
			for(Server server:mutualServers) {
				VerticalLayout sl = new VerticalLayout();
				if(!ServerUtil.canUseByRole(user, server, Zimmy.getInstance().getPool())) {
					continue;
				}
				List<String> planned = j.lrange("s:"+server.getId()+":planned", 0, -1);
				if(planned.isEmpty()) {
					sl.add(new Span("No posts planned"));
					Details details = new Details(server.getName(),sl);
					details.setOpened(true);
					root.add(details);
					continue;
				}
				for(String id:planned.stream().sorted().toList()) {
					sl.add(buildMessage(id,j));
				}
				Details details = new Details(server.getName(),sl);
				details.setOpened(true);
				root.add(details);
			}
			if(mutualServers.isEmpty()) {
				root.add(new Span("No shared servers"));
			}
		}
		
		return root;
	}
	
	private Component buildMessage(String id, Jedis j) {
		VerticalLayout msg = new VerticalLayout();
		String eid = "e:"+id;
		String mention = j.get(eid+":mention");
		Date date = new Date(Long.valueOf(j.get(eid+":date")));
		if(mention==null) {
			mention = "External server";
		}
		msg.add(new Span("Id: "+id));
		msg.add(new Span("Sending to "+mention));
		msg.add(new Span("Scheduled time: "+date.toString()));
		msg.add(new Span("Repeat "+CronUtil.getRepeatString(eid, j)));
		msg.add(new Hr());
		return msg;
	}
	
	private Component buildNavbar() {
		HorizontalLayout root = new HorizontalLayout();
		root.setWidthFull();
		root.setAlignItems(Alignment.CENTER);
		root.add(getTabs(),getAvatar());
		
		if (!isAuthorized()) {
			Button loginButton = new Button("Login with Discord");
			loginButton.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
			loginButton.getStyle().set("margin-right", "1rem");
			
			Anchor anchor = new Anchor("/oauth2/authorization/discord", loginButton);
			anchor.getElement().setAttribute("router-ignore", true);
			root.add(anchor);
		} else {
			Button logoutButton = new Button("Logout");
			logoutButton.addThemeVariants(ButtonVariant.LUMO_PRIMARY);
			logoutButton.getStyle().set("margin-right", "1rem");
			
			Anchor anchor = new Anchor("/logout", logoutButton);
			anchor.getElement().setAttribute("router-ignore", true);
			root.add(anchor);
		}
		return root;
	}
	
	private Avatar getAvatar() {
		Avatar avatar = new Avatar();
		if(!isAuthorized()||currentUser.isEmpty()) return avatar;
		JsonObject user = currentUser.get();
		avatar.setName(user.get("username").getAsString()+":"+user.get("discriminator").getAsString());
		avatar.setImage(String.format("https://cdn.discordapp.com/avatars/%s/%s.png", user.get("id").getAsString(), user.get("avatar").getAsString()));
		
		return avatar;
	}
}


