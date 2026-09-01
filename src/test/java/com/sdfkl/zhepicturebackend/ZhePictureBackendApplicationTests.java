package com.sdfkl.zhepicturebackend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 应用上下文测试不依赖本机数据库；Flyway 的真实迁移由
 * {@code FlywayMigrationIntegrationTest} 在 MySQL 容器中覆盖。
 */
@SpringBootTest(properties = "spring.flyway.enabled=false")
class ZhePictureBackendApplicationTests {

    @Test
    void contextLoads() {
    }

}
