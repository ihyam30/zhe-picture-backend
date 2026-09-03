package com.sdfkl.zhepicturebackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Shared browser-origin configuration for HTTP and WebSocket connections.
 */
@Component
@ConfigurationProperties(prefix = "app.cors")
public class AppCorsProperties {

    private static final String DEFAULT_ALLOWED_ORIGINS =
            "http://localhost:5173,http://127.0.0.1:5173";

    private String allowedOrigins = DEFAULT_ALLOWED_ORIGINS;

    @PostConstruct
    public void validate() {
        List<String> origins = getAllowedOriginList();
        if (origins.isEmpty()) {
            throw new IllegalStateException("app.cors.allowed-origins must contain at least one origin");
        }
        origins.forEach(this::validateOrigin);
    }

    public List<String> getAllowedOriginList() {
        if (allowedOrigins == null) {
            return Collections.emptyList();
        }
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }

    public String getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    private void validateOrigin(String origin) {
        if ("*".equals(origin) || origin.contains("*")) {
            throw new IllegalStateException(
                    "Wildcard origins are not allowed when browser credentials are enabled: " + origin);
        }
        try {
            URI uri = URI.create(origin);
            boolean supportedScheme = "http".equalsIgnoreCase(uri.getScheme())
                    || "https".equalsIgnoreCase(uri.getScheme());
            boolean hasHost = uri.getHost() != null;
            boolean hasUserInfo = uri.getUserInfo() != null;
            boolean hasPath = uri.getRawPath() != null && !uri.getRawPath().isEmpty();
            if (!supportedScheme || !hasHost || hasUserInfo || hasPath
                    || uri.getRawQuery() != null || uri.getRawFragment() != null) {
                throw new IllegalStateException("Invalid browser origin: " + origin);
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("Invalid browser origin: " + origin, exception);
        }
    }
}
