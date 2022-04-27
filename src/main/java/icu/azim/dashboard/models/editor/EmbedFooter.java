package icu.azim.dashboard.models.editor;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class EmbedFooter {
    @Size(max=2048)
    private String footer;
    //TODO date?
    private String timestamp;
    @Pattern(regexp = "/^(?:https?:\\/\\/|[%{]).*", message = "Invalid url")
    private String footerIconUrl;

    public String getFooter() {
        return footer;
    }
    public void setFooter(String footer) {
        this.footer = footer;
    }
    public String getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    public String getFooterIconUrl() {
        return footerIconUrl;
    }
    public void setFooterIconUrl(String footerIconUrl) {
        this.footerIconUrl = footerIconUrl;
    }
}
