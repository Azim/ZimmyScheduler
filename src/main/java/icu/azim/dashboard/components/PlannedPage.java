package icu.azim.dashboard.components;

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
import com.vaadin.flow.component.details.Details;
import com.vaadin.flow.component.html.Hr;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;

import icu.azim.dashboard.DashboardView;
import icu.azim.dashboard.util.DUtil;
import icu.azim.zimmy.Zimmy;
import icu.azim.zimmy.quartz.CronUtil;
import icu.azim.zimmy.util.ServerUtil;
import redis.clients.jedis.Jedis;

@PageTitle("Zimmy dashboard - planned")
@Route(value = "planned", layout = DashboardView.class)
public class PlannedPage extends VerticalLayout {
	public PlannedPage(OAuth2AuthorizedClientService clientService) {
		this.setWidthFull();

		boolean authorized = (SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken);
		
		Optional<JsonObject> currentUser;
		Optional<JsonArray> currentUserGuilds;
		if(authorized) {
			OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
	        OAuth2AuthorizedClient client = clientService.loadAuthorizedClient(token.getAuthorizedClientRegistrationId(), token.getName());
	        String accessToken = client.getAccessToken().getTokenValue();
	        currentUser = DUtil.getUserByToken(accessToken);
	        currentUserGuilds = DUtil.getUserGuildsByToken(accessToken);
		}else {
			currentUser = Optional.empty();
			currentUserGuilds = Optional.empty();
		}
		
		if(!authorized||currentUser.isEmpty()||currentUserGuilds.isEmpty()) return;
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
					this.add(details);
					continue;
				}
				for(String id:planned.stream().sorted().toList()) {
					sl.add(buildMessage(id,j));
				}
				Details details = new Details(server.getName(),sl);
				details.setOpened(true);
				this.add(details);
			}
			if(mutualServers.isEmpty()) {
				this.add(new Span("No shared servers"));
			}
		}
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
}
