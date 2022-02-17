package icu.azim.dashboard;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;

@Route("")
public class DashboardView extends VerticalLayout{
	public DashboardView() {
		add(new H1("Bot dashboard moment"));
		Button btn = new Button("the button");
		btn.addClickListener(e->{
			System.out.println("pressed");
		});
		add(btn);
		System.out.println("loaded dashboard view");
	}
}
