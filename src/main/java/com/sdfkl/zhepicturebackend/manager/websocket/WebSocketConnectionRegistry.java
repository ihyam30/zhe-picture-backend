package com.sdfkl.zhepicturebackend.manager.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket 连接登记器。
 *
 * <p>Redis 有序集合中的 score 是最后心跳时间，可在多实例下限制单用户连接数并清理崩溃连接。
 * Redis 显式关闭时使用本机集合；多实例模式下 Redis 暂时不可用则拒绝新连接，避免连接数限制被绕过。</p>
 */
@Component
public class WebSocketConnectionRegistry {

    private static final String KEY_PREFIX = "ws:connections:user:";
    private static final String ACQUIRE_SCRIPT =
            "local now = tonumber(ARGV[1]) "
                    + "local timeout = tonumber(ARGV[2]) "
                    + "local max = tonumber(ARGV[3]) "
                    + "redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - timeout) "
                    + "if redis.call('ZCARD', KEYS[1]) >= max then return 0 end "
                    + "redis.call('ZADD', KEYS[1], now, ARGV[4]) "
                    + "redis.call('EXPIRE', KEYS[1], math.ceil(timeout / 1000) + 30) "
                    + "return 1";
    private static final String HEARTBEAT_SCRIPT =
            "local last = redis.call('ZSCORE', KEYS[1], ARGV[2]) "
                    + "if last and tonumber(last) > tonumber(ARGV[1]) - tonumber(ARGV[3]) then "
                    + "redis.call('ZADD', KEYS[1], ARGV[1], ARGV[2]) "
                    + "redis.call('EXPIRE', KEYS[1], math.ceil(tonumber(ARGV[3]) / 1000) + 30) "
                    + "return 1 end "
                    + "if last then redis.call('ZREM', KEYS[1], ARGV[2]) end return 0";
    private static final String RELEASE_SCRIPT =
            "return redis.call('ZREM', KEYS[1], ARGV[1])";

    private static final DefaultRedisScript<Long> ACQUIRE_REDIS_SCRIPT =
            new DefaultRedisScript<>(ACQUIRE_SCRIPT, Long.class);
    private static final DefaultRedisScript<Long> HEARTBEAT_REDIS_SCRIPT =
            new DefaultRedisScript<>(HEARTBEAT_SCRIPT, Long.class);
    private static final DefaultRedisScript<Long> RELEASE_REDIS_SCRIPT =
            new DefaultRedisScript<>(RELEASE_SCRIPT, Long.class);

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${websocket.connection.max-per-user:3}")
    private int maxConnectionsPerUser;

    @Value("${websocket.heartbeat.timeout-ms:60000}")
    private long heartbeatTimeoutMs;

    @Value("${websocket.redis.enabled:true}")
    private boolean redisEnabled;

    private final ConcurrentHashMap<Long, ConcurrentHashMap<String, Long>> localConnections =
            new ConcurrentHashMap<>();

    /** 本机模式下将“清理、计数、登记”作为一个原子操作，避免并发握手突破连接上限。 */
    private final Object localConnectionsMonitor = new Object();

    public boolean tryAcquire(Long userId, String connectionId) {
        if (userId == null || connectionId == null) {
            return false;
        }
        if (!redisEnabled) {
            return tryAcquireLocal(userId, connectionId);
        }
        try {
            Long result = stringRedisTemplate.execute(
                    ACQUIRE_REDIS_SCRIPT,
                    Collections.singletonList(key(userId)),
                    String.valueOf(System.currentTimeMillis()),
                    String.valueOf(Math.max(10000L, heartbeatTimeoutMs)),
                    String.valueOf(Math.max(1, maxConnectionsPerUser)),
                    connectionId);
            return Long.valueOf(1L).equals(result);
        } catch (RuntimeException ignored) {
            // 多实例模式下 Redis 不可用时必须拒绝新连接，不能降级为本机计数。
            return false;
        }
    }

    public boolean heartbeat(Long userId, String connectionId) {
        if (userId == null || connectionId == null) {
            return false;
        }
        if (!redisEnabled) {
            return heartbeatLocal(userId, connectionId);
        }
        try {
            Long result = stringRedisTemplate.execute(
                    HEARTBEAT_REDIS_SCRIPT,
                    Collections.singletonList(key(userId)),
                    String.valueOf(System.currentTimeMillis()),
                    connectionId,
                    String.valueOf(Math.max(10000L, heartbeatTimeoutMs)));
            return Long.valueOf(1L).equals(result);
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    public void release(Long userId, String connectionId) {
        if (userId == null || connectionId == null) {
            return;
        }
        if (!redisEnabled) {
            releaseLocal(userId, connectionId);
            return;
        }
        try {
            stringRedisTemplate.execute(RELEASE_REDIS_SCRIPT,
                    Collections.singletonList(key(userId)), connectionId);
        } catch (RuntimeException ignored) {
            // Redis 不可用时不触碰本机缓存，避免与中心状态产生歧义。
            return;
        }
        Map<String, Long> connections = localConnections.get(userId);
        if (connections != null) {
            connections.remove(connectionId);
            if (connections.isEmpty()) {
                localConnections.remove(userId, connections);
            }
        }
    }

    private void touchLocal(Long userId, String connectionId) {
        Map<String, Long> connections = localConnections.get(userId);
        if (connections != null && connections.containsKey(connectionId)) {
            connections.put(connectionId,
                    System.currentTimeMillis() + Math.max(10000L, heartbeatTimeoutMs));
        }
    }

    private boolean tryAcquireLocal(Long userId, String connectionId) {
        synchronized (localConnectionsMonitor) {
            long now = System.currentTimeMillis();
            ConcurrentHashMap<String, Long> connections = localConnections.computeIfAbsent(userId,
                    ignoredKey -> new ConcurrentHashMap<>());
            connections.entrySet().removeIf(entry -> entry.getValue() <= now);
            if (connections.size() >= Math.max(1, maxConnectionsPerUser)) {
                return false;
            }
            return connections.putIfAbsent(connectionId,
                    now + Math.max(10000L, heartbeatTimeoutMs)) == null;
        }
    }

    private boolean heartbeatLocal(Long userId, String connectionId) {
        synchronized (localConnectionsMonitor) {
            Map<String, Long> connections = localConnections.get(userId);
            Long expiresAt = connections == null ? null : connections.get(connectionId);
            if (expiresAt == null || expiresAt <= System.currentTimeMillis()) {
                if (connections != null && expiresAt != null) {
                    connections.remove(connectionId, expiresAt);
                }
                return false;
            }
            touchLocal(userId, connectionId);
            return true;
        }
    }

    private void releaseLocal(Long userId, String connectionId) {
        synchronized (localConnectionsMonitor) {
            Map<String, Long> connections = localConnections.get(userId);
            if (connections != null) {
                connections.remove(connectionId);
                if (connections.isEmpty()) {
                    localConnections.remove(userId, connections);
                }
            }
        }
    }

    private String key(Long userId) {
        return KEY_PREFIX + userId;
    }
}
