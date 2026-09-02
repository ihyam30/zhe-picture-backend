package com.sdfkl.zhepicturebackend.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * AI 供应商的轻量熔断器。
 *
 * <p>当前项目只有一个供应商调用入口，使用进程级熔断即可避免故障期间持续打满供应商；
 * 任务本身仍由数据库租约保证多实例不会重复处理。</p>
 */
@Component
public class AiProviderCircuitBreaker {

    private final AtomicInteger consecutiveFailures = new AtomicInteger();
    private volatile long openUntil;

    @Value("${ai-task.circuit-breaker.failure-threshold:5}")
    private int failureThreshold;

    @Value("${ai-task.circuit-breaker.open-ms:60000}")
    private long openMs;

    public synchronized boolean allowRequest() {
        long now = System.currentTimeMillis();
        if (openUntil <= now) {
            return true;
        }
        return false;
    }

    public synchronized void recordSuccess() {
        consecutiveFailures.set(0);
        openUntil = 0L;
    }

    public synchronized void recordFailure() {
        int failures = consecutiveFailures.incrementAndGet();
        if (failures >= Math.max(1, failureThreshold)) {
            openUntil = System.currentTimeMillis() + Math.max(1000L, openMs);
        }
    }

    public long getOpenUntil() {
        return openUntil;
    }
}
