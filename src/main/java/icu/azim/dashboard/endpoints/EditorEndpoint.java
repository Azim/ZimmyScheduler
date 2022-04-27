package icu.azim.dashboard.endpoints;

import com.google.gson.Gson;
import com.vaadin.flow.server.auth.AnonymousAllowed;
import dev.hilla.Endpoint;
import icu.azim.dashboard.models.editor.Message;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;

import javax.annotation.security.PermitAll;
import java.util.Optional;

@Endpoint
@AnonymousAllowed
public class EditorEndpoint {
    private OAuth2AuthorizedClientService oauth;
    //TODO always check auth
    public EditorEndpoint(OAuth2AuthorizedClientService client){
        this.oauth = client;
    }

    public void test(){
        isLoggedIn().ifPresentOrElse(client->{
            System.out.println("Logged in: " + client.getAccessToken());
        }, ()->{
            System.out.println("Not logged in");
        });
    }

    public void submitMessage(Message message){
        System.out.println(new Gson().toJson(message));
    }

    private Optional<OAuth2AuthorizedClient> isLoggedIn(){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if(auth instanceof OAuth2AuthenticationToken){
            OAuth2AuthenticationToken a = (OAuth2AuthenticationToken) auth;
            return Optional.of(oauth.loadAuthorizedClient(a.getAuthorizedClientRegistrationId(),a.getName()));
        }
        return Optional.empty();
    }
}
