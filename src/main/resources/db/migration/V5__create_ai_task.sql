CREATE TABLE IF NOT EXISTS ai_task
(
    id                BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
    provider          VARCHAR(32)  NOT NULL DEFAULT 'aliyun' COMMENT 'AI 服务商',
    provider_task_id  VARCHAR(128) NULL COMMENT '服务商任务 id',
    user_id           BIGINT       NOT NULL COMMENT '发起用户 id',
    picture_id        BIGINT       NOT NULL COMMENT '源图片 id',
    space_id          BIGINT       NULL COMMENT '源图片所属空间 id',
    status            VARCHAR(32)  NOT NULL COMMENT '任务状态',
    output_url        VARCHAR(1024) NULL COMMENT '生成结果 URL',
    idempotency_key   VARCHAR(128) NOT NULL COMMENT '请求幂等号',
    error_message     VARCHAR(512) NULL COMMENT '错误信息',
    request_id        VARCHAR(128) NULL COMMENT '服务商请求 id',
    model             VARCHAR(64)  NULL COMMENT '模型名称',
    cost_amount       DECIMAL(20, 8) NULL COMMENT '调用费用',
    currency          VARCHAR(8)   NULL COMMENT '费用币种',
    create_time       DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    update_time       DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_ai_task_user_idempotency (user_id, idempotency_key),
    UNIQUE KEY uk_ai_task_provider_task (provider, provider_task_id),
    INDEX idx_ai_task_user_create (user_id, create_time),
    INDEX idx_ai_task_picture_create (picture_id, create_time),
    INDEX idx_ai_task_space_create (space_id, create_time),
    INDEX idx_ai_task_status_time (status, update_time)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = 'AI 图片处理任务';
