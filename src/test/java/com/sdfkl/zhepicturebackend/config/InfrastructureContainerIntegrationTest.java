package com.sdfkl.zhepicturebackend.config;

import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 验证 CI 使用的 MySQL 和 Redis 容器可以启动，避免集成测试隐式依赖开发机服务。
 */
@Testcontainers(disabledWithoutDocker = true)
class InfrastructureContainerIntegrationTest {

    @Container
    private static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0.36")
            .withDatabaseName("zhe_picture")
            .withUsername("root")
            .withPassword("test-password");

    @Container
    private static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7.2-alpine")
            .withExposedPorts(6379);

    @Test
    void shouldStartRequiredInfrastructureContainers() throws IOException {
        assertTrue(MYSQL.isRunning());
        assertTrue(REDIS.isRunning());

        try (Socket socket = new Socket(REDIS.getHost(), REDIS.getMappedPort(6379));
             OutputStream output = socket.getOutputStream();
             BufferedReader input = new BufferedReader(
                     new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8))) {
            output.write("*1\r\n$4\r\nPING\r\n".getBytes(StandardCharsets.UTF_8));
            output.flush();
            assertEquals("+PONG", input.readLine());
        }
    }
}
