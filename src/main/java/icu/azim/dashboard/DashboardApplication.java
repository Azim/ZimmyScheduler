package icu.azim.dashboard;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

import com.vaadin.flow.component.page.AppShellConfigurator;
import com.vaadin.flow.server.AppShellSettings;
import com.vaadin.flow.theme.Theme;

@Theme("disco")
@SpringBootApplication
public class DashboardApplication extends SpringBootServletInitializer implements AppShellConfigurator{
	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(DashboardApplication.class);
	}
	
	@Override
	public void configurePage(AppShellSettings settings) {
		AppShellConfigurator.super.configurePage(settings);
	    settings.addFavIcon("icon", "icons/icon-192.png", "192x192");
	    settings.addLink("shortcut icon", "icons/favicon.ico");
	}
	
    
	public DashboardApplication() {
		System.out.println("loaded dashboard class");
	}
}
