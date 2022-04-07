package icu.azim.dashboard.components;

import java.util.function.Consumer;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;

@Tag("embed-editor")
@JsModule("./embed-editor/embed-editor.ts")
public class EmbedEditor extends Component {
	private Consumer<String> onDone;
	
	public EmbedEditor(Consumer<String> onDone) {
		this.onDone = onDone;
	}
	
	public EmbedEditor(Consumer<String> onDone, String initialValue) {
		this.onDone = onDone;
		this.getElement().setProperty("json", initialValue);
	}
	
	@ClientCallable
	public void somethingHappened(String json) {
		onDone.accept(json);
	}
}
