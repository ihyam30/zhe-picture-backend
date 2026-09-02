package com.sdfkl.zhepicturebackend.manager.websocket;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WebSocketConnectionRegistryTest {

    @Test
    void localFallbackShouldRespectLimitAndReleaseConnections() {
        WebSocketConnectionRegistry registry = new WebSocketConnectionRegistry();
        ReflectionTestUtils.setField(registry, "maxConnectionsPerUser", 1);
        ReflectionTestUtils.setField(registry, "heartbeatTimeoutMs", 60000L);
        ReflectionTestUtils.setField(registry, "redisEnabled", false);

        assertTrue(registry.tryAcquire(1L, "connection-1"));
        assertFalse(registry.tryAcquire(1L, "connection-2"));
        registry.heartbeat(1L, "connection-1");
        registry.release(1L, "connection-1");
        assertTrue(registry.tryAcquire(1L, "connection-2"));
    }

    @Test
    void redisFailureShouldRejectConnectionInMultiInstanceMode() {
        WebSocketConnectionRegistry registry = new WebSocketConnectionRegistry();
        ReflectionTestUtils.setField(registry, "redisEnabled", true);

        assertFalse(registry.tryAcquire(1L, "connection-1"));
    }
}
