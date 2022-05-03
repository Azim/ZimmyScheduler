package icu.azim.dashboard.models.editor;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.hilla.Nonnull;

import javax.validation.constraints.Pattern;

public class EmbedImage {
    //TODO parent check "if any field not null, url should be not null"
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String url;
    private String proxy_url;
    private Integer height;
    private Integer width;

    public String getUrl() {
        return url;
    }
    public void setUrl(String url) {
        this.url = url;
    }
    public String getProxy_url() {
        return proxy_url;
    }
    public void setProxy_url(String proxy_url) {
        this.proxy_url = proxy_url;
    }
    public Integer getHeight() {
        return height;
    }
    public void setHeight(Integer height) {
        this.height = height;
    }
    public Integer getWidth() {
        return width;
    }
    public void setWidth(Integer width) {
        this.width = width;
    }
}
