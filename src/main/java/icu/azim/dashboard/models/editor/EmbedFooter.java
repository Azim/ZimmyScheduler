package icu.azim.dashboard.models.editor;

import dev.hilla.Nonnull;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class EmbedFooter {
    @Size(max=2048)
    private String text;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String icon_url;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String proxy_icon_url; //unused

    public String getText() {
        return text;
    }
    public void setText(String text) {
        this.text = text;
    }
    public String getIcon_url() {
        return icon_url;
    }
    public void setIcon_url(String icon_url) {
        this.icon_url = icon_url;
    }
    public String getProxy_icon_url() {
        return proxy_icon_url;
    }
    public void setProxy_icon_url(String proxy_icon_url) {
        this.proxy_icon_url = proxy_icon_url;
    }
}
