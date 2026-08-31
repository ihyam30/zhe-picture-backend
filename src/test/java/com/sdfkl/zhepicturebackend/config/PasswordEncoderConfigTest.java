package com.sdfkl.zhepicturebackend.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordEncoderConfigTest {

    @Test
    void shouldUseAdaptivePasswordHashing() {
        PasswordEncoder encoder = new PasswordEncoderConfig().passwordEncoder();
        String encoded = encoder.encode("password123");

        assertNotEquals("password123", encoded);
        assertTrue(encoder.matches("password123", encoded));
    }
}
