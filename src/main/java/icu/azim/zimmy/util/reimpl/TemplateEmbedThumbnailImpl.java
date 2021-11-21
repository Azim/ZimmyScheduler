package icu.azim.zimmy.util.reimpl;

import com.fasterxml.jackson.databind.JsonNode;

import icu.azim.zimmy.util.Util;

import org.apache.logging.log4j.Logger;
import org.javacord.api.DiscordApi;
import org.javacord.api.entity.message.embed.EmbedThumbnail;
import org.javacord.core.util.FileContainer;
import org.javacord.core.util.logging.LoggerUtil;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.concurrent.CompletableFuture;

/**
 * The implementation of {@link EmbedThumbnail}.
 */
public class TemplateEmbedThumbnailImpl implements EmbedThumbnail {

    /**
     * The logger of this class.
     */
    private static final Logger logger = LoggerUtil.getLogger(TemplateEmbedThumbnailImpl.class);

    private final String url;
    private final String proxyUrl;
    private final int height;
    private final int width;

    /**
     * Creates a new embed thumbnail.
     *
     * @param data The json data of the thumbnail.
     */
    public TemplateEmbedThumbnailImpl(JsonNode data) {
        url = data.has("url") ? data.get("url").asText() : null;
        proxyUrl = data.has("proxy_url") ? data.get("proxy_url").asText() : null;
        height = data.has("height") ? data.get("height").asInt() : -1;
        width = data.has("width") ? data.get("width").asInt() : -1;
    }

    @Override
    public URL getUrl() {
        if (url == null) {
            return null;
        }
        try {
            return new URL(url);
		} catch (MalformedURLException e) {
			try {
				return new URL(Util.templateUrl);
			} catch (MalformedURLException e1) {
	            logger.warn("Seems like the url of the embed thumbnail is malformed! Please contact the developer!", e1);
	            return null;
			}
	    }
    }

    @Override
    public URL getProxyUrl() {
        if (proxyUrl == null) {
            return null;
        }
        try {
            return new URL(proxyUrl);
		} catch (MalformedURLException e) {
			try {
				return new URL(Util.templateUrl);
			} catch (MalformedURLException e1) {
	            logger.warn("Seems like the embed thumbnail's proxy url is malformed! Please contact the developer!", e1);
	            return null;
			}
	    }
    }

    @Override
    public int getHeight() {
        return height;
    }

    @Override
    public int getWidth() {
        return width;
    }
    
    @Override
    public CompletableFuture<BufferedImage> downloadAsBufferedImage(DiscordApi api) {
        return new FileContainer(getUrl()).asBufferedImage(api);
    }

    @Override
    public CompletableFuture<byte[]> downloadAsByteArray(DiscordApi api) {
        return new FileContainer(getUrl()).asByteArray(api);
    }

    @Override
    public InputStream downloadAsInputStream(DiscordApi api) throws IOException {
        return new FileContainer(getUrl()).asInputStream(api);
    }
}
