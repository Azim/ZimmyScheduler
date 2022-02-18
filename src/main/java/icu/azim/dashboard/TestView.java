package icu.azim.dashboard;

import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.Route;

@SuppressWarnings("serial")
@Route("test")
public class TestView extends VerticalLayout {
    public TestView() {
        add("Only visible when logged in");
    }
}