package com.sdfkl.zhepicturebackend.config;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class FlywayMigrationLayoutTest {

    private static final List<String> MIGRATIONS = Arrays.asList(
            "V1__create_user.sql",
            "V2__create_space.sql",
            "V3__create_picture.sql",
            "V4__create_space_user.sql",
            "V5__create_ai_task.sql",
            "V6__create_outbox_event.sql",
            "V7__create_picture_upload_task.sql",
            "V8__add_picture_upload_columns.sql",
            "V9__add_picture_indexes.sql",
            "V10__migrate_picture_object_keys.sql",
            "V11__add_ai_task_request_hash.sql",
            "V12__add_ai_task_retry_and_usage.sql"
    );

    @Test
    void shouldKeepOrderedFlywayMigrations() {
        for (String migration : MIGRATIONS) {
            assertTrue(readMigration(migration).length() > 0, "迁移文件为空: " + migration);
        }
    }

    @Test
    void shouldDefineAiTaskOwnershipAndCostFields() {
        String migration = readMigration("V5__create_ai_task.sql");
        assertTrue(migration.contains("provider_task_id"));
        assertTrue(migration.contains("user_id"));
        assertTrue(migration.contains("idempotency_key"));
        assertTrue(migration.contains("cost_amount"));
        assertTrue(migration.contains("uk_ai_task_user_idempotency"));
        assertTrue(readMigration("V11__add_ai_task_request_hash.sql").contains("request_hash"));
    }

    @Test
    void shouldKeepPhaseTwoSchemaCompatibleWithBaselineFour() {
        String migration = readMigration("V8__add_picture_upload_columns.sql");
        assertTrue(migration.contains("objectKey"));
        assertTrue(migration.contains("uploadStatus"));
        assertTrue(migration.contains("reservedSize"));
        assertTrue(migration.contains("reservedCount"));
    }

    @Test
    void shouldDefineAiRetryAndUsageFields() {
        String migration = readMigration("V12__add_ai_task_retry_and_usage.sql");
        assertTrue(migration.contains("retry_count"));
        assertTrue(migration.contains("next_retry_time"));
        assertTrue(migration.contains("lease_until"));
        assertTrue(migration.contains("submit_time"));
        assertTrue(migration.contains("metrics_succeeded"));
        assertTrue(migration.contains("CREATE TABLE IF NOT EXISTS ai_usage_record"));
        assertTrue(migration.contains("uk_ai_usage_task"));
    }

    private String readMigration(String name) {
        String path = "/db/migration/" + name;
        try (InputStream inputStream = getClass().getResourceAsStream(path)) {
            if (inputStream == null) {
                throw new AssertionError("找不到迁移文件: " + path);
            }
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int length;
            while ((length = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, length);
            }
            return new String(outputStream.toByteArray(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new AssertionError("读取迁移文件失败: " + path, e);
        }
    }
}
