package icu.azim.dashboard.models.editor;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class MessageAuthor {
    @Size(max=80)
    private String username;
    @Pattern(regexp = "^(?:https?:\\/\\/|[%{]).*")
    private String avatarUrl;

    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getAvatarUrl() {
        return avatarUrl;
    }
    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
