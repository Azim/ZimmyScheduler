package icu.azim.dashboard.models.editor;

public class Embed {
    private EmbedAuthor author;
    private EmbedBody body;
    private Field[] fields;
    private String imageUrl;
    private String thumbnailUrl;
    private EmbedFooter footer;

    public EmbedAuthor getAuthor() {
        return author;
    }
    public void setAuthor(EmbedAuthor author) {
        this.author = author;
    }
    public EmbedBody getBody() {
        return body;
    }
    public void setBody(EmbedBody body) {
        this.body = body;
    }
    public Field[] getFields() {
        return fields;
    }
    public void setFields(Field[] fields) {
        this.fields = fields;
    }
    public String getImageUrl() {
        return imageUrl;
    }
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
    public String getThumbnailUrl() {
        return thumbnailUrl;
    }
    public void setThumbnailUrl(String thumbnailUrl) {
        this.thumbnailUrl = thumbnailUrl;
    }
    public EmbedFooter getFooter() {
        return footer;
    }
    public void setFooter(EmbedFooter footer) {
        this.footer = footer;
    }
}
