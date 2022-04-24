package icu.azim.dashboard.models.editor;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;

public class Field {
	@NotEmpty(message = "Cannot be empty")
	private String name;
	@NotEmpty(message = "Cannot be empty")
	private String value;
	@NotNull
	private Boolean inline;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getValue() {
		return value;
	}
	public void setValue(String value) {
		this.value = value;
	}
	public boolean isInline() {
		return inline;
	}
	public void setInline(boolean inline) {
		this.inline = inline;
	}
}
