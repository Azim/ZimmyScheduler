package icu.azim.dashboard.models.editor;

import dev.hilla.Nonnull;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

public class Message {
    private MessageAuthor author;
    @Size(max=2000)
    private String content;
    @Nonnull
    private Embed[] embeds;

    public MessageAuthor getAuthor() {
        return author;
    }
    public void setAuthor(MessageAuthor author) {
        this.author = author;
    }
    public String getContent() {
        return content;
    }
    public void setContent(String content) {
        this.content = content;
    }
    public Embed[] getEmbeds() {
        return embeds;
    }
    public void setEmbeds(Embed[] embeds) {
        this.embeds = embeds;
    }
}
