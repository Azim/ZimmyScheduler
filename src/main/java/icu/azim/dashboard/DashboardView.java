package icu.azim.dashboard;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import com.google.gson.JsonObject;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.applayout.AppLayout;
import com.vaadin.flow.component.avatar.Avatar;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.orderedlayout.FlexComponent.Alignment;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.tabs.Tab;
import com.vaadin.flow.component.tabs.Tabs;
import com.vaadin.flow.router.BeforeEnterEvent;
import com.vaadin.flow.router.BeforeEnterObserver;
import com.vaadin.flow.router.HighlightConditions;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.router.RouterLayout;
import com.vaadin.flow.router.RouterLink;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import icu.azim.dashboard.components.AboutPage;
import icu.azim.dashboard.components.EmbedEditor;
import icu.azim.dashboard.components.PlannedPage;
import icu.azim.dashboard.util.DUtil;

@Route("")
@AnonymousAllowed
public class DashboardView extends AppLayout implements RouterLayout, BeforeEnterObserver {
	
	//TODO https://discord.com/channels/668218342779256857/780558939217461298/953747169268101151
    private Optional<JsonObject> currentUser; //TODO wrapper object with no optional
    
	public DashboardView(OAuth2AuthorizedClientService clientService) {
		if(isAuthorized()) {
			OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) SecurityContextHolder.getContext().getAuthentication();
	        OAuth2AuthorizedClient client = clientService.loadAuthorizedClient(token.getAuthorizedClientRegistrationId(), token.getName());
	        String accessToken = client.getAccessToken().getTokenValue();
	        currentUser = DUtil.getUserByToken(accessToken);
		}else {
			currentUser = Optional.empty();
		}
		addToNavbar(buildNavbar());
	}

	private boolean isAuthorized() {
		return (SecurityContextHolder.getContext().getAuthentication() instanceof OAuth2AuthenticationToken);
	}
	
	private RouteTabs getTabs() {

        RouteTabs routeTabs = new RouteTabs();
        routeTabs.setWidthFull();
        
        routeTabs.add(new RouterLink("About", AboutPage.class));
        routeTabs.add(new RouterLink("Schedule", EmbedEditor.class));
        RouterLink planned = new RouterLink("Planned posts", PlannedPage.class);
        planned.setEnabled(isAuthorized());
        routeTabs.add(planned);
        
        return routeTabs;
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
		if(user.has("avatar")) {
			avatar.setImage(String.format("https://cdn.discordapp.com/avatars/%s/%s.png", user.get("id").getAsString(), user.get("avatar").getAsString()));
		}
		return avatar;
	}
	
    private static class RouteTabs extends Tabs implements BeforeEnterObserver {
        private final Map<RouterLink, Tab> routerLinkTabMap = new HashMap<>();

        public void add(RouterLink routerLink) {
            routerLink.setHighlightCondition(HighlightConditions.sameLocation());
            routerLink.setHighlightAction(
                (link, shouldHighlight) -> {
                    if (shouldHighlight) setSelectedTab(routerLinkTabMap.get(routerLink));
                }
            );
            Tab tab = new Tab(routerLink);
            tab.setEnabled(routerLink.isEnabled());
            routerLinkTabMap.put(routerLink, tab);
            add(routerLinkTabMap.get(routerLink));
        }

        @Override
        public void beforeEnter(BeforeEnterEvent event) {
            // In case no tabs will match
            setSelectedTab(null);
        }
    }

	@Override
	public void beforeEnter(BeforeEnterEvent event) {
	    if (event.getNavigationTarget().equals(getClass()))
	        event.forwardTo(AboutPage.class);
	}
	
}


