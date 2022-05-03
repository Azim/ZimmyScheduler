package icu.azim.dashboard.models.editor;

import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

public class EmbedAuthor {
    @Size(max=256)
    private String name;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String url;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String icon_url;
    @Pattern(regexp = Message.urlPattern, message = "Invalid url")
    private String proxy_icon_url;

}
