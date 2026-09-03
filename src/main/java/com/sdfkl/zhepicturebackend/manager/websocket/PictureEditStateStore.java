package com.sdfkl.zhepicturebackend.manager.websocket;

import cn.hutool.json.JSONUtil;
import com.sdfkl.zhepicturebackend.model.vo.UserVO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * WebSocket 在线状态和编辑锁元数据的 Redis 状态存储。
 *
 * <p>Pub/Sub 只负责传递事件，不保留历史消息；这里保存可恢复的当前状态，
 * 让新连接和锁过期清理不依赖某一个应用实例仍然存活。</p>
 */
@Component
public class PictureEditStateStore {

    private static final String PRESENCE_KEY_PREFIX = "ws:picture:presence:";
    private static final String LOCK_KEY_PREFIX = "ws:edit-lock:picture:";
    private static final String LOCK_STATE_KEY_PREFIX = "ws:edit-lock:state:";
    private static final String LOCK_EXPIRY_INDEX_KEY = "ws:edit-lock:expiry";

    private static final String REMOVE_LOCK_SCRIPT =
            "if redis.call('HGET', KEYS[1], 'ownerToken') == ARGV[1] then "
                    + "redis.call('DEL', KEYS[1]); redis.call('ZREM', KEYS[2], ARGV[2]); return 1 "
                    + "end return 0";
    private static final String SAVE_LOCK_SCRIPT =
            "redis.call('HSET', KEYS[1], 'ownerToken', ARGV[1], 'user', ARGV[2], 'expiresAt', ARGV[3]) "
                    + "redis.call('ZADD', KEYS[2], ARGV[3], ARGV[4]) "
                    + "redis.call('PEXPIRE', KEYS[1], ARGV[5]) return 1";
    private static final String REFRESH_LOCK_SCRIPT =
            "if redis.call('GET', KEYS[1]) == ARGV[1] "
                    + "and redis.call('HGET', KEYS[2], 'ownerToken') == ARGV[1] then "
                    + "redis.call('HSET', KEYS[2], 'expiresAt', ARGV[2]) "
                    + "redis.call('ZADD', KEYS[3], ARGV[2], ARGV[3]) "
                    + "local ttl = tonumber(ARGV[2]) - tonumber(ARGV[4]) + 30000 "
                    + "if ttl < 10000 then ttl = 10000 end "
                    + "redis.call('PEXPIRE', KEYS[2], ttl) return 1 "
                    + "end return 0";
    private static final String RELEASE_EXPIRED_LOCK_SCRIPT =
            "local expiresAt = redis.call('HGET', KEYS[2], 'expiresAt') "
                    + "if not expiresAt then redis.call('ZREM', KEYS[3], ARGV[1]); return '' end "
                    + "if tonumber(expiresAt) > tonumber(ARGV[2]) then return '' end "
                    + "local ownerToken = redis.call('HGET', KEYS[2], 'ownerToken') "
                    + "local userJson = redis.call('HGET', KEYS[2], 'user') "
                    + "if ownerToken and redis.call('GET', KEYS[1]) == ownerToken then "
                    + "redis.call('DEL', KEYS[1]) end "
                    + "redis.call('DEL', KEYS[2]); redis.call('ZREM', KEYS[3], ARGV[1]) "
                    + "return userJson or ''";

    private static final DefaultRedisScript<Long> REMOVE_LOCK_REDIS_SCRIPT =
            new DefaultRedisScript<>(REMOVE_LOCK_SCRIPT, Long.class);
    private static final DefaultRedisScript<Long> SAVE_LOCK_REDIS_SCRIPT =
            new DefaultRedisScript<>(SAVE_LOCK_SCRIPT, Long.class);
    private static final DefaultRedisScript<Long> REFRESH_LOCK_REDIS_SCRIPT =
            new DefaultRedisScript<>(REFRESH_LOCK_SCRIPT, Long.class);
    private static final DefaultRedisScript<String> RELEASE_EXPIRED_LOCK_REDIS_SCRIPT =
            new DefaultRedisScript<>(RELEASE_EXPIRED_LOCK_SCRIPT, String.class);

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${websocket.redis.enabled:true}")
    private boolean redisEnabled;

    @Value("${websocket.heartbeat.timeout-ms:60000}")
    private long heartbeatTimeoutMs;

    public boolean registerPresence(Long pictureId, String connectionId, UserVO user) {
        if (!redisEnabled) {
            return true;
        }
        if (pictureId == null || connectionId == null || user == null) {
            return false;
        }
        try {
            PresenceSnapshot snapshot = new PresenceSnapshot(user, presenceExpiresAt());
            stringRedisTemplate.opsForHash().put(
                    presenceKey(pictureId), connectionId, JSONUtil.toJsonStr(snapshot));
            stringRedisTemplate.expire(presenceKey(pictureId), presenceTtlMs(), TimeUnit.MILLISECONDS);
            return true;
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    public void refreshPresence(Long pictureId, String connectionId, UserVO user) {
        if (pictureId == null || connectionId == null || user == null || !redisEnabled) {
            return;
        }
        try {
            Object rawValue = stringRedisTemplate.opsForHash().get(presenceKey(pictureId), connectionId);
            if (rawValue == null) {
                stringRedisTemplate.opsForHash().put(
                        presenceKey(pictureId), connectionId,
                        JSONUtil.toJsonStr(new PresenceSnapshot(user, presenceExpiresAt())));
                stringRedisTemplate.expire(presenceKey(pictureId), presenceTtlMs(), TimeUnit.MILLISECONDS);
                return;
            }
            PresenceSnapshot snapshot = JSONUtil.toBean(String.valueOf(rawValue), PresenceSnapshot.class);
            snapshot.setExpiresAt(presenceExpiresAt());
            stringRedisTemplate.opsForHash().put(
                    presenceKey(pictureId), connectionId, JSONUtil.toJsonStr(snapshot));
            stringRedisTemplate.expire(presenceKey(pictureId), presenceTtlMs(), TimeUnit.MILLISECONDS);
        } catch (RuntimeException ignored) {
            // 状态恢复失败不应影响当前 WebSocket 消息处理。
        }
    }

    public void removePresence(Long pictureId, String connectionId) {
        if (!redisEnabled) {
            return;
        }
        try {
            stringRedisTemplate.opsForHash().delete(presenceKey(pictureId), connectionId);
        } catch (RuntimeException ignored) {
            // Redis 恢复后，presence key 会自然过期。
        }
    }

    public List<UserVO> listPresence(Long pictureId) {
        if (!redisEnabled) {
            return Collections.emptyList();
        }
        try {
            Map<Object, Object> entries = stringRedisTemplate.opsForHash().entries(presenceKey(pictureId));
            List<UserVO> users = new ArrayList<>();
            long now = System.currentTimeMillis();
            for (Map.Entry<Object, Object> entry : entries.entrySet()) {
                if (entry.getValue() != null) {
                    PresenceSnapshot snapshot = JSONUtil.toBean(
                            String.valueOf(entry.getValue()), PresenceSnapshot.class);
                    if (snapshot.getUser() != null && snapshot.getExpiresAt() > now) {
                        users.add(snapshot.getUser());
                    } else {
                        stringRedisTemplate.opsForHash().delete(presenceKey(pictureId), entry.getKey());
                    }
                }
            }
            return users;
        } catch (RuntimeException ignored) {
            return Collections.emptyList();
        }
    }

    public boolean saveLock(Long pictureId, String ownerToken, UserVO user, long expiresAt) {
        if (!redisEnabled) {
            return true;
        }
        try {
            long stateTtlMs = Math.max(10000L,
                    expiresAt - System.currentTimeMillis()) + 30000L;
            Long result = stringRedisTemplate.execute(
                    SAVE_LOCK_REDIS_SCRIPT,
                    Arrays.asList(lockStateKey(pictureId), LOCK_EXPIRY_INDEX_KEY),
                    ownerToken, JSONUtil.toJsonStr(user), String.valueOf(expiresAt),
                    String.valueOf(pictureId), String.valueOf(stateTtlMs));
            return Long.valueOf(1L).equals(result);
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    public LockSnapshot getLock(Long pictureId) {
        if (!redisEnabled) {
            return null;
        }
        try {
            Map<Object, Object> values = stringRedisTemplate.opsForHash().entries(lockStateKey(pictureId));
            if (values.isEmpty()) {
                return null;
            }
            long expiresAt = Long.parseLong(String.valueOf(values.get("expiresAt")));
            if (expiresAt <= System.currentTimeMillis()) {
                return null;
            }
            Object userValue = values.get("user");
            if (userValue == null) {
                return null;
            }
            Object currentOwner = stringRedisTemplate.opsForValue().get(lockKey(pictureId));
            if (!String.valueOf(values.get("ownerToken")).equals(String.valueOf(currentOwner))) {
                return null;
            }
            return new LockSnapshot(
                    String.valueOf(values.get("ownerToken")),
                    JSONUtil.toBean(String.valueOf(userValue), UserVO.class),
                    expiresAt);
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    public boolean refreshLock(Long pictureId, String ownerToken, long expiresAt) {
        if (!redisEnabled) {
            return true;
        }
        try {
            Long result = stringRedisTemplate.execute(
                    REFRESH_LOCK_REDIS_SCRIPT,
                    Arrays.asList(lockKey(pictureId), lockStateKey(pictureId), LOCK_EXPIRY_INDEX_KEY),
                    ownerToken, String.valueOf(expiresAt), String.valueOf(pictureId),
                    String.valueOf(System.currentTimeMillis()));
            return Long.valueOf(1L).equals(result);
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    public void removeLock(Long pictureId, String ownerToken) {
        if (!redisEnabled) {
            return;
        }
        try {
            stringRedisTemplate.execute(
                    REMOVE_LOCK_REDIS_SCRIPT,
                    Arrays.asList(lockStateKey(pictureId), LOCK_EXPIRY_INDEX_KEY),
                    ownerToken, String.valueOf(pictureId));
        } catch (RuntimeException ignored) {
            // 中心锁仍有 TTL，状态索引会由过期扫描清理。
        }
    }

    public List<ExpiredLock> releaseExpiredLocks(long now) {
        if (!redisEnabled) {
            return Collections.emptyList();
        }
        Set<String> pictureIds;
        try {
            pictureIds = stringRedisTemplate.opsForZSet().rangeByScore(
                    LOCK_EXPIRY_INDEX_KEY, Double.NEGATIVE_INFINITY, now);
        } catch (RuntimeException ignored) {
            return Collections.emptyList();
        }
        if (pictureIds == null || pictureIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<ExpiredLock> expiredLocks = new ArrayList<>();
        for (String pictureIdValue : pictureIds) {
            try {
                Long pictureId = Long.valueOf(pictureIdValue);
                String userJson = stringRedisTemplate.execute(
                        RELEASE_EXPIRED_LOCK_REDIS_SCRIPT,
                        Arrays.asList(lockKey(pictureId), lockStateKey(pictureId), LOCK_EXPIRY_INDEX_KEY),
                        pictureIdValue, String.valueOf(now));
                if (userJson != null && !userJson.isEmpty()) {
                    expiredLocks.add(new ExpiredLock(
                            pictureId, JSONUtil.toBean(userJson, UserVO.class)));
                }
            } catch (RuntimeException ignored) {
                // 单个图片清理失败不应阻塞其他过期锁。
            }
        }
        return expiredLocks;
    }

    private long presenceTtlMs() {
        return Math.max(10000L, heartbeatTimeoutMs) * 2L;
    }

    private long presenceExpiresAt() {
        return System.currentTimeMillis() + Math.max(10000L, heartbeatTimeoutMs);
    }

    private String presenceKey(Long pictureId) {
        return PRESENCE_KEY_PREFIX + pictureId;
    }

    private String lockKey(Long pictureId) {
        return LOCK_KEY_PREFIX + pictureId;
    }

    private String lockStateKey(Long pictureId) {
        return LOCK_STATE_KEY_PREFIX + pictureId;
    }

    public static class LockSnapshot {
        private final String ownerToken;
        private final UserVO user;
        private final long expiresAt;

        public LockSnapshot(String ownerToken, UserVO user, long expiresAt) {
            this.ownerToken = ownerToken;
            this.user = user;
            this.expiresAt = expiresAt;
        }

        public String getOwnerToken() {
            return ownerToken;
        }

        public UserVO getUser() {
            return user;
        }

        public long getExpiresAt() {
            return expiresAt;
        }
    }

    public static class ExpiredLock {
        private final Long pictureId;
        private final UserVO user;

        public ExpiredLock(Long pictureId, UserVO user) {
            this.pictureId = pictureId;
            this.user = user;
        }

        public Long getPictureId() {
            return pictureId;
        }

        public UserVO getUser() {
            return user;
        }
    }

    public static class PresenceSnapshot {
        private UserVO user;
        private long expiresAt;

        public PresenceSnapshot() {
        }

        public PresenceSnapshot(UserVO user, long expiresAt) {
            this.user = user;
            this.expiresAt = expiresAt;
        }

        public UserVO getUser() {
            return user;
        }

        public void setUser(UserVO user) {
            this.user = user;
        }

        public long getExpiresAt() {
            return expiresAt;
        }

        public void setExpiresAt(long expiresAt) {
            this.expiresAt = expiresAt;
        }
    }
}
