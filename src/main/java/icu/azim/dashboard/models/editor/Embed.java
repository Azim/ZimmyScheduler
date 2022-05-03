package icu.azim.dashboard.models.editor;

import dev.hilla.Nonnull;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class Embed {
    @Size(max=256)
    private String title;
    @Size(max=4096)
    private String description;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String url;
    private String timestamp;
    private Integer color;
    /*
    @Pattern(regexp = "/^#(?:[0-9a-fA-F]{3}){1,2}$/")
    @Size(max=7)
    private String color;
    */
    private EmbedFooter footer;
    private EmbedImage image;
    private EmbedImage thumbnail;
    private EmbedAuthor author;
    @Nonnull
    private Field[] fields;

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
    public String getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
    public Integer getColor() {
        return color;
    }
    public void setColor(Integer color) {
        this.color = color;
    }
    public EmbedFooter getFooter() {
        return footer;
    }
    public void setFooter(EmbedFooter footer) {
        this.footer = footer;
    }
    public EmbedImage getImage() {
        return image;
    }
    public void setImage(EmbedImage image) {
        this.image = image;
    }
    public EmbedImage getThumbnail() {
        return thumbnail;
    }
    public void setThumbnail(EmbedImage thumbnail) {
        this.thumbnail = thumbnail;
    }
    public EmbedAuthor getAuthor() {
        return author;
    }
    public void setAuthor(EmbedAuthor author) {
        this.author = author;
    }
    public Field[] getFields() {
        return fields;
    }
    public void setFields(Field[] fields) {
        this.fields = fields;
    }
}
