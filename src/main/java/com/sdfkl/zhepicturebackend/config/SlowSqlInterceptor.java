package com.sdfkl.zhepicturebackend.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Plugin;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Properties;

/**
 * 记录超过阈值的 SQL 调用。日志只记录 mapped statement，不输出参数和原始 SQL，避免敏感数据泄露。
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "observability.slow-sql.enabled", havingValue = "true", matchIfMissing = true)
@Intercepts({
        @Signature(type = Executor.class, method = "query", args = {
                MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class
        }),
        @Signature(type = Executor.class, method = "query", args = {
                MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class,
                org.apache.ibatis.cache.CacheKey.class, BoundSql.class
        }),
        @Signature(type = Executor.class, method = "update", args = {
                MappedStatement.class, Object.class
        })
})
public class SlowSqlInterceptor implements Interceptor {

    @Value("${observability.slow-sql.threshold-ms:500}")
    private long thresholdMs = 500L;

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startedAt = System.nanoTime();
        try {
            return invocation.proceed();
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000L;
            if (durationMs >= Math.max(1L, thresholdMs)) {
                Object firstArgument = invocation.getArgs().length == 0 ? null : invocation.getArgs()[0];
                String statementId = firstArgument instanceof MappedStatement
                        ? ((MappedStatement) firstArgument).getId() : "unknown";
                log.warn("slow_sql statement={} operation={} durationMs={} thresholdMs={}",
                        statementId, invocation.getMethod().getName(), durationMs, thresholdMs);
            }
        }
    }

    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // 配置由 Spring 的 observability.slow-sql.threshold-ms 统一管理。
    }
}
