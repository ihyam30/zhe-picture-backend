package com.sdfkl.zhepicturebackend.manager.websocket;

import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.annotation.Resource;

/**
 * 接收其他实例发布的图片编辑事件，并交给本实例的会话集合广播。
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "websocket.redis.enabled", havingValue = "true", matchIfMissing = true)
public class PictureEditRedisSubscriber implements MessageListener {

    @Resource
    private RedisConnectionFactory redisConnectionFactory;

    @Resource
    private PictureEditHandler pictureEditHandler;

    private RedisMessageListenerContainer container;

    @PostConstruct
    public void start() {
        container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.addMessageListener(this, new PatternTopic(PictureEditRedisBroadcaster.CHANNEL_PREFIX + "*"));
        container.afterPropertiesSet();
        container.start();
    }

    @PreDestroy
    public void stop() {
        if (container != null) {
            container.stop();
        }
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            PictureEditRedisMessage redisMessage = JSONUtil.toBean(
                    new String(message.getBody(), java.nio.charset.StandardCharsets.UTF_8),
                    PictureEditRedisMessage.class);
            if (redisMessage != null && redisMessage.getPictureId() != null
                    && redisMessage.getMessage() != null) {
                pictureEditHandler.broadcastLocal(redisMessage.getPictureId(),
                        redisMessage.getMessage(), redisMessage.getExcludeSessionId());
            }
        } catch (RuntimeException e) {
            log.warn("解析 WebSocket Redis 广播消息失败", e);
        }
    }
}
