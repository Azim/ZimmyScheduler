package icu.azim.dashboard.util;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.web.client.RestOperations;
import org.springframework.web.client.RestTemplate;

import com.vaadin.flow.spring.security.VaadinWebSecurityConfigurerAdapter;

@Configuration
public class SecurityConfig extends VaadinWebSecurityConfigurerAdapter {
	
	
    @Override
    protected void configure(HttpSecurity http) throws Exception {
    	http.csrf().disable()

        // Register our CustomRequestCache, which saves unauthorized access attempts, so the user is redirected after login.
        .requestCache().requestCache(new CustomRequestCache())

        .and().authorizeRequests().antMatchers("/oauth2/authorization/discord", "/login/oauth2/callback/**", "/").permitAll().and()
        .oauth2Login(oauth -> { oauth.defaultSuccessUrl("/"); }).logout().logoutSuccessUrl("/")
        // Restrict access to our application.
        .and().authorizeRequests()

        // Allow all Vaadin internal requests.
        .requestMatchers(SecurityUtils::isFrameworkInternalRequest).permitAll()

        // Allow all requests by logged-in users.
        .anyRequest().authenticated();
    }

    @Override
    public void configure(WebSecurity web) {
        web.ignoring().antMatchers(
            // Client-side JS
            "/VAADIN/**",

            // the standard favicon URI
            "/favicon.ico",

            // the robots exclusion standard
            "/robots.txt",

            // web application manifest
            "/manifest.webmanifest",
            "/sw.js",
            "/offline.html",

            // icons and images
            "/icons/**",
            "/images/**",
            "/styles/**",

            // (development mode) H2 debugging console
            "/h2-console/**");
      }

    @Bean
    public RestOperations restOperations() {
        return new RestTemplate();
    }

    @Bean
    @Override
    protected AuthenticationManager authenticationManager() throws Exception {
        return super.authenticationManager();
    }
}
