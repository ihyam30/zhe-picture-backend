package com.sdfkl.zhepicturebackend.manager.websocket;

import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditResponseMessage;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PictureEditRedisBroadcasterTest {

    @Test
    void publishShouldFallbackWhenRedisHasNoSubscribers() {
        PictureEditRedisBroadcaster broadcaster = new PictureEditRedisBroadcaster();
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        ReflectionTestUtils.setField(broadcaster, "stringRedisTemplate", redisTemplate);
        ReflectionTestUtils.setField(broadcaster, "redisEnabled", true);
        when(redisTemplate.execute(any(RedisCallback.class))).thenReturn(0L);

        assertFalse(broadcaster.publish(10L, new PictureEditResponseMessage(), null));
    }

    @Test
    void publishShouldReportSuccessWhenRedisHasSubscribers() {
        PictureEditRedisBroadcaster broadcaster = new PictureEditRedisBroadcaster();
        StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
        ReflectionTestUtils.setField(broadcaster, "stringRedisTemplate", redisTemplate);
        ReflectionTestUtils.setField(broadcaster, "redisEnabled", true);
        when(redisTemplate.execute(any(RedisCallback.class))).thenReturn(1L);

        assertTrue(broadcaster.publish(10L, new PictureEditResponseMessage(), null));
    }
}
