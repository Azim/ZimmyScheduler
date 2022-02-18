package icu.azim.dashboard;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.notification.Notification;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import icu.azim.dashboard.util.DUtil;

@SuppressWarnings("serial")
@Route("")
@AnonymousAllowed
public class DashboardView extends VerticalLayout{
    private final OAuth2AuthorizedClientService clientService;
    
	public DashboardView(OAuth2AuthorizedClientService clientService) {
		this.clientService = clientService;
		
		Button btn = new Button("the button");
		btn.addClickListener(e->{
			System.out.println("pressed");
		});
		
		
		add(Navbar(),new H1("Bot dashboard moment"), btn);
		
		System.out.println("loaded dashboard view");
	}
	
    private Component Navbar() {
        HorizontalLayout root = new HorizontalLayout();
        root.setWidthFull();
        root.setAlignItems(Alignment.CENTER);
        Span name = new Span("Dashboard thing");
        name.getStyle().set("padding-left", "1rem");
        root.add(name);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        

        if (!(authentication instanceof OAuth2AuthenticationToken)) {
            Button loginButton = new Button();
            loginButton.setText("Login with Discord");
            loginButton.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
            loginButton.getStyle().set("padding-right", "1rem");
            loginButton.addClassName("toolbar");
            Anchor anchor = new Anchor("/oauth2/authorization/discord", loginButton);
            anchor.getElement().setAttribute("router-ignore", true);
            root.add(anchor);
        } else {
        	Button logout = new Button();
        	logout.setText("Log out");
        	logout.addThemeVariants(ButtonVariant.LUMO_TERTIARY);
        	logout.getStyle().set("padding-right", "1rem");
        	logout.addClassName("toolbar");
            Anchor anchor = new Anchor("/logout", logout);
            anchor.getElement().setAttribute("router-ignore", true);
            root.add(anchor);
            
            Notification.show("Logged In");
            OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
            
            OAuth2AuthorizedClient client = this.clientService.loadAuthorizedClient(token.getAuthorizedClientRegistrationId(), token.getName());
            String accessToken = client.getAccessToken().getTokenValue();
            Notification.show("Logged in with token: " + accessToken);
            DUtil.getUserByToken(accessToken);
        }

        root.setFlexGrow(1, name);
        root.addClassNames("contrast-5pct");

        return root;
    }
}


