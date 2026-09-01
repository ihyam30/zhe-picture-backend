-- 为已有数据库及全新数据库补充 AI 请求指纹字段。
-- V5 创建基础任务表，V11 在所有数据库上统一完成字段升级，避免依赖客户端 DELIMITER 语法。
ALTER TABLE ai_task
    ADD COLUMN request_hash VARCHAR(64) NULL COMMENT '请求参数指纹'
    AFTER idempotency_key;
