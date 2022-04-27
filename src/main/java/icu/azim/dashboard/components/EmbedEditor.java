package icu.azim.dashboard.components;

import java.util.function.Consumer;

import com.vaadin.flow.component.ClientCallable;
import com.vaadin.flow.component.Component;
import com.vaadin.flow.component.Tag;
import com.vaadin.flow.component.dependency.JsModule;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.server.auth.AnonymousAllowed;

import icu.azim.dashboard.DashboardView;
import icu.azim.dashboard.models.editor.Field;

@Tag("embed-editor")
@JsModule("./embed-editor/embed-editor.ts")
@PageTitle("Zimmy dashboard")
@AnonymousAllowed
@Route(value = "schedule", layout = DashboardView.class)
public class EmbedEditor extends Component {
	private Consumer<String> onDone;
	
	public EmbedEditor() {

	}
	
	public EmbedEditor(String initialValue) {
		this.getElement().setProperty("json", initialValue);
	}
	
	@ClientCallable
	public void somethingHappened(String json) {
		//onDone.accept(json);
	}

	@ClientCallable
	public void consumeField(Field field){
		System.out.println(field.getName());
	}
}
