package com.sdfkl.zhepicturebackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.ReflectionUtils;
import org.springframework.web.servlet.mvc.method.RequestMappingInfoHandlerMapping;
import springfox.documentation.spring.web.plugins.WebMvcRequestHandlerProvider;

import java.lang.reflect.Field;
import java.util.List;

/**
 * Knife4j 当前依赖的 Springfox 与 Spring Boot 2.6 的 Actuator 映射存在兼容性问题。
 * Springfox 只处理传统 MVC 映射，Actuator 端点仍由 Actuator 自己管理。
 */
@Configuration
public class SpringfoxCompatibilityConfig {

    @Bean
    public static org.springframework.beans.factory.config.BeanPostProcessor
    springfoxHandlerProviderBeanPostProcessor() {
        return new org.springframework.beans.factory.config.BeanPostProcessor() {
            @Override
            public Object postProcessAfterInitialization(Object bean, String beanName) {
                if (bean instanceof WebMvcRequestHandlerProvider) {
                    removePathPatternHandlerMappings(bean);
                }
                return bean;
            }

            @SuppressWarnings("unchecked")
            private void removePathPatternHandlerMappings(Object provider) {
                Field field = ReflectionUtils.findField(provider.getClass(), "handlerMappings");
                if (field == null) {
                    return;
                }
                ReflectionUtils.makeAccessible(field);
                try {
                    List<RequestMappingInfoHandlerMapping> mappings =
                            (List<RequestMappingInfoHandlerMapping>) field.get(provider);
                    mappings.removeIf(mapping -> mapping.getPatternParser() != null);
                } catch (IllegalAccessException exception) {
                    throw new IllegalStateException("Unable to configure Springfox handler mappings", exception);
                }
            }
        };
    }
}
