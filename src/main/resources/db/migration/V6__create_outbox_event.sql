CREATE TABLE IF NOT EXISTS outbox_event
(
    id            BIGINT       NOT NULL PRIMARY KEY COMMENT 'id',
    eventType     VARCHAR(64)  NOT NULL COMMENT '事件类型',
    aggregateId   BIGINT       NULL COMMENT '聚合 id',
    dedupeKey     VARCHAR(192) NOT NULL COMMENT '幂等键',
    payload       TEXT         NOT NULL COMMENT '事件负载 JSON',
    status        VARCHAR(32)  NOT NULL COMMENT '事件状态',
    retryCount    INT          NOT NULL DEFAULT 0,
    nextRetryTime DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lockedUntil   DATETIME     NULL,
    lastError     VARCHAR(512) NULL,
    createTime    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateTime    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_outbox_dedupeKey (dedupeKey),
    INDEX idx_outbox_poll (status, nextRetryTime, lockedUntil)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = '事务 Outbox 事件';
