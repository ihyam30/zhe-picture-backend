package com.sdfkl.zhepicturebackend.manager.websocket;

import cn.hutool.json.JSONUtil;
import com.sdfkl.zhepicturebackend.manager.websocket.model.PictureEditResponseMessage;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.nio.charset.StandardCharsets;

/**
 * 图片编辑事件 Redis 发布器。
 */
@Component
public class PictureEditRedisBroadcaster {

    public static final String CHANNEL_PREFIX = "ws:picture-edit:";

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${websocket.redis.enabled:true}")
    private boolean redisEnabled;

    public boolean publish(Long pictureId, PictureEditResponseMessage message, String excludeSessionId) {
        if (!redisEnabled) {
            return false;
        }
        PictureEditRedisMessage redisMessage = new PictureEditRedisMessage();
        redisMessage.setPictureId(pictureId);
        redisMessage.setExcludeSessionId(excludeSessionId);
        redisMessage.setMessage(message);
        try {
            String channel = CHANNEL_PREFIX + pictureId;
            String payload = JSONUtil.toJsonStr(redisMessage);
            Long receiverCount = stringRedisTemplate.execute((RedisCallback<Long>) connection -> connection.publish(
                    channel.getBytes(StandardCharsets.UTF_8), payload.getBytes(StandardCharsets.UTF_8)));
            // 没有订阅者时消息不会被任何实例转发，交给本机广播作为兜底。
            return receiverCount != null && receiverCount > 0;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
