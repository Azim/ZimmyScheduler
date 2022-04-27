package icu.azim.dashboard.models.editor;

import javax.validation.constraints.Size;

public class EmbedAuthor {
    @Size(max=256)
    private String author;
    //TODO add url validation
    private String authorUrl;
    private String authorIconUrl;

    public String getAuthor() {
        return author;
    }
    public void setAuthor(String author) {
        this.author = author;
    }
    public String getAuthorUrl() {
        return authorUrl;
    }
    public void setAuthorUrl(String authorUrl) {
        this.authorUrl = authorUrl;
    }
    public String getAuthorIconUrl() {
        return authorIconUrl;
    }
    public void setAuthorIconUrl(String authorIconUrl) {
        this.authorIconUrl = authorIconUrl;
    }
}
