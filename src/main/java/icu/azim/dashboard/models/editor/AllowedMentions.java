package icu.azim.dashboard.models.editor;

import dev.hilla.Nonnull;

public class AllowedMentions {
    @Nonnull
    private String[] parse;
    private String[] roles;
    private String[] users;

    public String[] getParse() {
        return parse;
    }
    public void setParse(String[] parse) {
        this.parse = parse;
    }
    public String[] getRoles() {
        return roles;
    }
    public void setRoles(String[] roles) {
        this.roles = roles;
    }
    public String[] getUsers() {
        return users;
    }
    public void setUsers(String[] users) {
        this.users = users;
    }
}
