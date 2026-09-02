package com.sdfkl.zhepicturebackend.manager.websocket;

import com.sdfkl.zhepicturebackend.config.AppCorsProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

import javax.annotation.Resource;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Resource
    private PictureEditHandler pictureEditHandler;

    @Resource
    private WsHandshakeInterceptor wsHandshakeInterceptor;

    @Resource
    private AppCorsProperties appCorsProperties;

    @Value("${websocket.message.max-bytes:65536}")
    private int maxMessageBytes;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(pictureEditHandler, "/ws/picture/edit")
                .addInterceptors(wsHandshakeInterceptor)
                .setAllowedOrigins(appCorsProperties.getAllowedOriginList().toArray(new String[0]));
    }

    @Bean
    @ConditionalOnProperty(name = "websocket.container.enabled", havingValue = "true", matchIfMissing = true)
    public ServletServerContainerFactoryBean webSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(Math.max(1, maxMessageBytes));
        container.setMaxBinaryMessageBufferSize(Math.max(1, maxMessageBytes));
        return container;
    }
}
