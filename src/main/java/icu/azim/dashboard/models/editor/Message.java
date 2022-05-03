package icu.azim.dashboard.models.editor;

import com.fasterxml.jackson.annotation.JsonProperty;
import dev.hilla.Nonnull;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

//this entire package was used for auto-generation of ts data model for clientside validation and is basically useless but oh well
public class Message {
    public static final String urlPattern = "^(?:https?:\\/\\/|[%{])"; //TODO fix regex

    @Size(max=2000)
    private String content;
    @Size(max=80)
    private String username;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String avatar_url;
    @Nonnull
    private Embed[] embeds;
    private AllowedMentions allowed_mentions;

    public String getContent() {
        return content;
    }
    public void setContent(String content) {
        this.content = content;
    }
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getAvatar_url() {
        return avatar_url;
    }
    public void setAvatar_url(String avatar_url) {
        this.avatar_url = avatar_url;
    }
    public Embed[] getEmbeds() {
        return embeds;
    }
    public void setEmbeds(Embed[] embeds) {
        this.embeds = embeds;
    }
    public AllowedMentions getAllowed_mentions() {
        return allowed_mentions;
    }
    public void setAllowed_mentions(AllowedMentions allowed_mentions) {
        this.allowed_mentions = allowed_mentions;
    }
}
