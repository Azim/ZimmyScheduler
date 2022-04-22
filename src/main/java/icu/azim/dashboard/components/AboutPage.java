package icu.azim.dashboard.components;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.Anchor;
import com.vaadin.flow.component.html.AnchorTarget;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import icu.azim.dashboard.DashboardView;

@AnonymousAllowed
@PageTitle("Zimmy dashboard - new")
@Route(value = "about", layout = DashboardView.class)
public class AboutPage extends VerticalLayout {
	public AboutPage() {
		this.setAlignItems(Alignment.START);
		this.getStyle().set("flex-wrap", "wrap");
		
		HorizontalLayout row1 = new HorizontalLayout(
			a("Invite link", "https://discord.com/oauth2/authorize?client_id=721752791512776806&permissions=805424208&scope=bot%20applications.commands&prompt=consent"),
			a("Privacy policy", "https://gist.github.com/Azim/4bbccc2ca0206cf2c840740253f65c14"),
			a("Github repository", "https://github.com/Azim/ZimmyScheduler"),
			a("our Discord server", "https://discord.gg/nBjSGa4"),
			a("Donation page", "https://en.liberapay.com/Azim0ff/")
		);
		row1.getStyle().set("flex-wrap", "wrap");
		
		HorizontalLayout row2 = new HorizontalLayout(
			a("Discohook", "https://discohook.app/"),
			a("Cron tutorial", "https://www.freeformatter.com/cron-expression-generator-quartz.html#cronexpressionexamples")
		);
		row2.getStyle().set("flex-wrap", "wrap");
		
		this.add(
			new H3("Zimmy the discord message scheduler"),
			new Span("A simple bot to plan/schedule webhook messages, including repeating ones (via cron or set time period)"),
			new Span("Now with dashboard! Same functionality, but in more convenient format! Probably!"),
			row1,
			row2
		);
		
	}
	

	private Component a(String text, String url) {
		Anchor anchor = new Anchor(url, new Button(text));
		anchor.setTarget(AnchorTarget.BLANK);
		return anchor;
	}
}
