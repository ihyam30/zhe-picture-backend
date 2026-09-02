package com.sdfkl.zhepicturebackend.manager.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * 图片编辑锁。Redis 使用 SETNX + TTL，并通过 Lua 脚本保证只能由持有者释放或续期。
 */
@Component
public class PictureEditLockService {

    private static final String KEY_PREFIX = "ws:edit-lock:picture:";
    private static final String RELEASE_SCRIPT =
            "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0";
    private static final String REFRESH_SCRIPT =
            "if redis.call('GET', KEYS[1]) == ARGV[1] then "
                    + "return redis.call('PEXPIRE', KEYS[1], ARGV[2]) end return 0";
    private static final DefaultRedisScript<Long> RELEASE_REDIS_SCRIPT =
            new DefaultRedisScript<>(RELEASE_SCRIPT, Long.class);
    private static final DefaultRedisScript<Long> REFRESH_REDIS_SCRIPT =
            new DefaultRedisScript<>(REFRESH_SCRIPT, Long.class);

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${websocket.edit-lock.ttl-ms:60000}")
    private long lockTtlMs;

    @Value("${websocket.redis.enabled:true}")
    private boolean redisEnabled;

    private final Map<Long, LocalLock> localLocks = new ConcurrentHashMap<>();

    public boolean tryAcquire(Long pictureId, String ownerToken) {
        if (!redisEnabled) {
            return tryAcquireLocal(pictureId, ownerToken);
        }
        String key = key(pictureId);
        try {
            Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(
                    key, ownerToken, Math.max(10000L, lockTtlMs), TimeUnit.MILLISECONDS);
            return Boolean.TRUE.equals(acquired);
        } catch (RuntimeException ignored) {
            // 多实例模式下 Redis 不可用时必须拒绝获取锁，不能降级为本机锁导致脑裂。
            return false;
        }
    }

    public boolean release(Long pictureId, String ownerToken) {
        if (!redisEnabled) {
            return releaseLocal(pictureId, ownerToken);
        }
        boolean released = false;
        try {
            released = Long.valueOf(1L).equals(stringRedisTemplate.execute(
                    RELEASE_REDIS_SCRIPT, Collections.singletonList(key(pictureId)), ownerToken));
        } catch (RuntimeException ignored) {
            // Redis 不可用时不触碰本机缓存，等待中心锁自然过期，避免误释放其他实例的锁。
            return false;
        }
        localLocks.remove(pictureId, new LocalLock(ownerToken, 0L));
        return released;
    }

    public boolean refresh(Long pictureId, String ownerToken) {
        if (!redisEnabled) {
            return refreshLocal(pictureId, ownerToken);
        }
        try {
            return Long.valueOf(1L).equals(stringRedisTemplate.execute(
                    REFRESH_REDIS_SCRIPT, Collections.singletonList(key(pictureId)), ownerToken,
                    String.valueOf(Math.max(10000L, lockTtlMs))));
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    private boolean tryAcquireLocal(Long pictureId, String ownerToken) {
        long now = System.currentTimeMillis();
        LocalLock newLock = new LocalLock(ownerToken, now + Math.max(10000L, lockTtlMs));
        LocalLock oldLock = localLocks.putIfAbsent(pictureId, newLock);
        if (oldLock != null && oldLock.expireAt <= now) {
            localLocks.remove(pictureId, oldLock);
            oldLock = localLocks.putIfAbsent(pictureId, newLock);
        }
        return oldLock == null;
    }

    private boolean releaseLocal(Long pictureId, String ownerToken) {
        LocalLock lock = localLocks.get(pictureId);
        return lock != null && ownerToken.equals(lock.ownerToken) && localLocks.remove(pictureId, lock);
    }

    private boolean refreshLocal(Long pictureId, String ownerToken) {
        LocalLock lock = localLocks.get(pictureId);
        if (lock == null || !ownerToken.equals(lock.ownerToken)
                || lock.expireAt <= System.currentTimeMillis()) {
            if (lock != null && lock.expireAt <= System.currentTimeMillis()) {
                localLocks.remove(pictureId, lock);
            }
            return false;
        }
        lock.expireAt = System.currentTimeMillis() + Math.max(10000L, lockTtlMs);
        return true;
    }

    private String key(Long pictureId) {
        return KEY_PREFIX + pictureId;
    }

    private static class LocalLock {
        private final String ownerToken;
        private volatile long expireAt;

        private LocalLock(String ownerToken, long expireAt) {
            this.ownerToken = ownerToken;
            this.expireAt = expireAt;
        }

        @Override
        public boolean equals(Object object) {
            return object instanceof LocalLock && ownerToken.equals(((LocalLock) object).ownerToken);
        }

        @Override
        public int hashCode() {
            return ownerToken.hashCode();
        }
    }
}
