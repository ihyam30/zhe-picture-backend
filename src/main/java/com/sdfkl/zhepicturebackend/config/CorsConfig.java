package com.sdfkl.zhepicturebackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.annotation.Resource;

/**
 * 全局跨域配置
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Resource
    private AppCorsProperties appCorsProperties;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 覆盖所有请求
        registry.addMapping("/**")
                .allowCredentials(true)
                .allowedOrigins(appCorsProperties.getAllowedOriginList().toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("Accept", "Content-Type", "Authorization", "Origin", "X-Requested-With",
                        "Idempotency-Key")
                .exposedHeaders("Content-Disposition", "X-Request-ID", "X-Trace-ID")
                .maxAge(3600);
    }
}
