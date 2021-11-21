package icu.azim.zimmy.util.reimpl;

import com.fasterxml.jackson.databind.JsonNode;

import icu.azim.zimmy.util.Util;

import org.apache.logging.log4j.Logger;
import org.javacord.api.DiscordApi;
import org.javacord.api.entity.message.embed.EmbedAuthor;
import org.javacord.core.util.FileContainer;
import org.javacord.core.util.logging.LoggerUtil;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

/**
 * The implementation of {@link EmbedAuthor}.
 */
public class TemplateEmbedAuthorImpl implements EmbedAuthor {

    /**
     * The logger of this class.
     */
    private static final Logger logger = LoggerUtil.getLogger(TemplateEmbedAuthorImpl.class);

    private final String name;
    private final String url;
    private final String iconUrl;
    private final String proxyIconUrl;

    /**
     * Creates a new embed author.
     *
     * @param data The json data of the author.
     */
    public TemplateEmbedAuthorImpl(JsonNode data) {
        name = data.has("name") ? data.get("name").asText() : null;
        url = data.has("url") && !data.get("url").isNull() ? data.get("url").asText() : null;
        iconUrl = data.has("icon_url") && !data.get("icon_url").isNull() ? data.get("icon_url").asText() : null;
        proxyIconUrl = data.has("proxy_icon_url") && !data.get("proxy_icon_url").isNull()
                ? data.get("proxy_icon_url").asText() : null;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public Optional<URL> getUrl() {
        if (url == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(new URL(url));     
        } catch (MalformedURLException e) {
			try {
				return Optional.of(new URL(Util.templateUrl));
			} catch (MalformedURLException e1) {
	            logger.warn("Seems like the url of the embed author is malformed! Please contact the developer!", e1);
	            return Optional.empty();
			}
        }
    }

    @Override
    public Optional<URL> getIconUrl() {
        if (iconUrl == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(new URL(iconUrl));
        } catch (MalformedURLException e) {
			try {
				return Optional.of(new URL(Util.templateUrl));
			} catch (MalformedURLException e1) {
	            logger.warn("Seems like the icon url of the embed author is malformed! Please contact the developer!", e1);
	            return Optional.empty();
			}
        }
    }

    @Override
    public Optional<URL> getProxyIconUrl() {
        if (proxyIconUrl == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(new URL(proxyIconUrl));
        } catch (MalformedURLException e) {
			try {
				return Optional.of(new URL(Util.templateUrl));
			} catch (MalformedURLException e1) {
	            logger.warn("Seems like the embed author's proxy icon url is malformed! Please contact the developer!", e1);
	            return Optional.empty();
			}
        }
    }

    @Override
    public Optional<CompletableFuture<BufferedImage>> downloadIconAsBufferedImage(DiscordApi api) {
        return getIconUrl().map(url -> new FileContainer(url).asBufferedImage(api));
    }

    @Override
    public Optional<CompletableFuture<byte[]>> downloadIconAsByteArray(DiscordApi api) {
        return getIconUrl().map(url -> new FileContainer(url).asByteArray(api));
    }

    @Override
    public Optional<InputStream> downloadIconAsInputStream(DiscordApi api) throws IOException {
        URL iconUrl = getIconUrl().orElse(null);
        if (iconUrl == null) {
            return Optional.empty();
        }
        return Optional.of(new FileContainer(iconUrl).asInputStream(api));
    }

}
