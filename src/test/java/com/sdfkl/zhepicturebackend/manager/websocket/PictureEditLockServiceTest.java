package com.sdfkl.zhepicturebackend.manager.websocket;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PictureEditLockServiceTest {

    @Test
    void explicitlyLocalModeShouldAllowOnlyOneOwner() {
        PictureEditLockService service = new PictureEditLockService();
        ReflectionTestUtils.setField(service, "lockTtlMs", 60000L);
        ReflectionTestUtils.setField(service, "redisEnabled", false);

        assertTrue(service.tryAcquire(10L, "owner-1"));
        assertFalse(service.tryAcquire(10L, "owner-2"));
        assertTrue(service.release(10L, "owner-1"));
        assertTrue(service.tryAcquire(10L, "owner-2"));
    }

    @Test
    void redisFailureShouldFailClosedInMultiInstanceMode() {
        PictureEditLockService service = new PictureEditLockService();
        ReflectionTestUtils.setField(service, "redisEnabled", true);

        assertFalse(service.tryAcquire(10L, "owner-1"));
    }
}
