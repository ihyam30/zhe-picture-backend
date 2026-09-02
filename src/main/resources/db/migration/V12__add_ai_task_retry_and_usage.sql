-- 第四阶段：补充 AI 异步轮询、重试租约和费用流水字段。
ALTER TABLE ai_task
    ADD COLUMN retry_count INT NOT NULL DEFAULT 0 COMMENT '重试/轮询失败次数' AFTER currency,
    ADD COLUMN next_retry_time DATETIME NULL COMMENT '下一次轮询或重试时间' AFTER retry_count,
    ADD COLUMN timeout_time DATETIME NULL COMMENT '任务最终超时时间' AFTER next_retry_time,
    ADD COLUMN last_polled_time DATETIME NULL COMMENT '最近一次轮询时间' AFTER timeout_time,
    ADD COLUMN lease_until DATETIME NULL COMMENT '轮询处理租约到期时间' AFTER last_polled_time,
    ADD COLUMN submit_time VARCHAR(64) NULL COMMENT '供应商提交时间' AFTER lease_until,
    ADD COLUMN scheduled_time VARCHAR(64) NULL COMMENT '供应商调度时间' AFTER submit_time,
    ADD COLUMN end_time VARCHAR(64) NULL COMMENT '供应商结束时间' AFTER scheduled_time,
    ADD COLUMN metrics_total INT NULL COMMENT '供应商任务总数' AFTER end_time,
    ADD COLUMN metrics_succeeded INT NULL COMMENT '供应商成功数' AFTER metrics_total,
    ADD COLUMN metrics_failed INT NULL COMMENT '供应商失败数' AFTER metrics_succeeded;

CREATE INDEX idx_ai_task_poll
    ON ai_task (status, next_retry_time, lease_until);

CREATE TABLE IF NOT EXISTS ai_usage_record
(
    id                BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
    task_id           BIGINT       NOT NULL COMMENT '本地 AI 任务 id',
    user_id           BIGINT       NOT NULL COMMENT '用户 id',
    space_id          BIGINT       NULL COMMENT '空间 id',
    provider          VARCHAR(32)  NOT NULL COMMENT 'AI 服务商',
    provider_task_id  VARCHAR(128) NULL COMMENT '服务商任务 id',
    status            VARCHAR(32)  NOT NULL COMMENT '费用记录状态',
    request_units     INT          NULL COMMENT '调用计量单位',
    cost_amount       DECIMAL(20, 8) NULL COMMENT '调用费用',
    currency          VARCHAR(8)   NULL COMMENT '费用币种',
    error_message     VARCHAR(512) NULL COMMENT '失败原因',
    create_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_ai_usage_task (task_id),
    INDEX idx_ai_usage_user_time (user_id, create_time),
    INDEX idx_ai_usage_space_time (space_id, create_time)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'AI 调用次数和费用流水';
