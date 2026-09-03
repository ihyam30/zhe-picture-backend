package com.sdfkl.zhepicturebackend.config;

import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;

/**
 * 为每个 HTTP 请求建立可安全传递的 requestId/traceId，并写入响应头和日志 MDC。
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestTraceFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";
    public static final String TRACE_ID_HEADER = "X-Trace-ID";
    public static final String REQUEST_ID_MDC_KEY = "requestId";
    public static final String TRACE_ID_MDC_KEY = "traceId";
    private static final int DEFAULT_MAX_ID_LENGTH = 128;

    @Value("${observability.request.max-id-length:128}")
    private int maxIdLength = DEFAULT_MAX_ID_LENGTH;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String requestId = normalize(request.getHeader(REQUEST_ID_HEADER), generateId());
        String traceId = normalize(request.getHeader(TRACE_ID_HEADER), requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);
        response.setHeader(TRACE_ID_HEADER, traceId);
        MDC.put(REQUEST_ID_MDC_KEY, requestId);
        MDC.put(TRACE_ID_MDC_KEY, traceId);
        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(REQUEST_ID_MDC_KEY);
            MDC.remove(TRACE_ID_MDC_KEY);
        }
    }

    private String normalize(String candidate, String fallback) {
        int maxLength = maxIdLength > 0
                ? Math.min(maxIdLength, DEFAULT_MAX_ID_LENGTH)
                : DEFAULT_MAX_ID_LENGTH;
        if (!StringUtils.hasText(candidate) || candidate.length() > maxLength) {
            return fallback;
        }
        for (int i = 0; i < candidate.length(); i++) {
            char character = candidate.charAt(i);
            if (!(character >= 'a' && character <= 'z')
                    && !(character >= 'A' && character <= 'Z')
                    && !(character >= '0' && character <= '9')
                    && character != '.' && character != '_' && character != ':'
                    && character != '-') {
                return fallback;
            }
        }
        return candidate;
    }

    private String generateId() {
        return UUID.randomUUID().toString();
    }
}
