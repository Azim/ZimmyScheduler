package icu.azim.dashboard.models.editor;

import javax.validation.constraints.Size;

public class EmbedFooter {
    @Size(max=2048)
    private String footer;
    private String timestamp;
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
