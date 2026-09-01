package com.sdfkl.zhepicturebackend.config;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AppCorsPropertiesTest {

    @Test
    void shouldTrimAndDeduplicateAllowedOrigins() {
        AppCorsProperties properties = properties(" http://localhost:5173,https://picture.example.com,http://localhost:5173 ");

        assertEquals(
                Arrays.asList("http://localhost:5173", "https://picture.example.com"),
                properties.getAllowedOriginList());
    }

    @Test
    void shouldRejectWildcardOriginWhenCredentialsAreEnabled() {
        AppCorsProperties properties = properties("*");

        assertThrows(IllegalStateException.class, properties::validate);
    }

    @Test
    void shouldRejectOriginWithPath() {
        AppCorsProperties properties = properties("https://picture.example.com/app");

        assertThrows(IllegalStateException.class, properties::validate);
    }

    private AppCorsProperties properties(String allowedOrigins) {
        AppCorsProperties properties = new AppCorsProperties();
        properties.setAllowedOrigins(allowedOrigins);
        return properties;
    }
}
