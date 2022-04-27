package icu.azim.dashboard.models.editor;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class EmbedBody {
    @Size(max=256)
    private String title;
    @Size(max=4096)
    private String description;
    //TODO messages for everyone and anyone
    @Pattern(regexp = "/^(?:https?:\\/\\/|[%{]).*", message = "Invalid url")
    private String url;
    //TODO
    @Pattern(regexp = "/^#(?:[0-9a-fA-F]{3}){1,2}$/")
    @Size(max=7)
    private String color;

    public String getTitle() {
        return title;
    }
    public void setTitle(String title) {
        this.title = title;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public String getColor() {
        return color;
    }
    public void setColor(String color) {
        this.color = color;
    }
}
