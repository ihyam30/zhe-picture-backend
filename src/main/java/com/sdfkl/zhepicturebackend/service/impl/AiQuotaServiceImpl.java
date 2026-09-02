package com.sdfkl.zhepicturebackend.service.impl;

import com.sdfkl.zhepicturebackend.service.AiQuotaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDate;
import java.util.Collections;

/**
 * 基于 Redis Lua 脚本的 AI 日额度服务。
 *
 * <p>用户额度和空间额度在同一个脚本中校验并递增，避免只扣减一侧造成额度漂移。</p>
 */
@Service
public class AiQuotaServiceImpl implements AiQuotaService {

    private static final String USER_KEY_PREFIX = "ai:quota:user:";
    private static final String SPACE_KEY_PREFIX = "ai:quota:space:";
    private static final String USER_AND_SPACE_SCRIPT =
            "local userValue = redis.call('GET', KEYS[1]) "
                    + "local spaceValue = redis.call('GET', KEYS[2]) "
                    + "if userValue and tonumber(userValue) >= tonumber(ARGV[1]) then return 0 end "
                    + "if spaceValue and tonumber(spaceValue) >= tonumber(ARGV[2]) then return 0 end "
                    + "redis.call('INCR', KEYS[1]) "
                    + "redis.call('EXPIRE', KEYS[1], ARGV[3]) "
                    + "redis.call('INCR', KEYS[2]) "
                    + "redis.call('EXPIRE', KEYS[2], ARGV[3]) "
                    + "return 1";
    private static final String USER_ONLY_SCRIPT =
            "local userValue = redis.call('GET', KEYS[1]) "
                    + "if userValue and tonumber(userValue) >= tonumber(ARGV[1]) then return 0 end "
                    + "redis.call('INCR', KEYS[1]) "
                    + "redis.call('EXPIRE', KEYS[1], ARGV[2]) "
                    + "return 1";

    private static final DefaultRedisScript<Long> USER_AND_SPACE_REDIS_SCRIPT =
            new DefaultRedisScript<>(USER_AND_SPACE_SCRIPT, Long.class);
    private static final DefaultRedisScript<Long> USER_ONLY_REDIS_SCRIPT =
            new DefaultRedisScript<>(USER_ONLY_SCRIPT, Long.class);

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Value("${ai-task.quota.user-daily-limit:20}")
    private long userDailyLimit;

    @Value("${ai-task.quota.space-daily-limit:100}")
    private long spaceDailyLimit;

    @Value("${ai-task.quota.key-expire-seconds:172800}")
    private long keyExpireSeconds;

    @Override
    public boolean tryReserve(Long userId, Long spaceId) {
        if (userId == null || userDailyLimit <= 0
                || (spaceId != null && spaceDailyLimit <= 0)) {
            return false;
        }
        String date = LocalDate.now().toString();
        String userKey = USER_KEY_PREFIX + userId + ":" + date;
        long expireSeconds = Math.max(3600L, keyExpireSeconds);
        Long result;
        if (spaceId == null) {
            result = stringRedisTemplate.execute(
                    USER_ONLY_REDIS_SCRIPT,
                    Collections.singletonList(userKey),
                    String.valueOf(userDailyLimit),
                    String.valueOf(expireSeconds));
        } else {
            String spaceKey = SPACE_KEY_PREFIX + spaceId + ":" + date;
            result = stringRedisTemplate.execute(
                    USER_AND_SPACE_REDIS_SCRIPT,
                    java.util.Arrays.asList(userKey, spaceKey),
                    String.valueOf(userDailyLimit),
                    String.valueOf(spaceDailyLimit),
                    String.valueOf(expireSeconds));
        }
        return Long.valueOf(1L).equals(result);
    }
}
