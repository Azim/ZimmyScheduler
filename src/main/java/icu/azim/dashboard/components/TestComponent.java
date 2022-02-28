package icu.azim.dashboard.components;

import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;

@SuppressWarnings("serial")
@Tag("test-component")
@JsModule("./test-component.ts")
public class TestComponent extends Component {
	public TestComponent() {
		getElement().setProperty("name", "Java");
	}
}