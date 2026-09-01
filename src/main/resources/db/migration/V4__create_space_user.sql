CREATE TABLE IF NOT EXISTS space_user
(
    id         BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
    spaceId    BIGINT                              NOT NULL COMMENT '空间 id',
    userId     BIGINT                              NOT NULL COMMENT '用户 id',
    spaceRole  VARCHAR(128) DEFAULT 'viewer'       NULL COMMENT '空间角色：viewer/editor/admin',
    createTime DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    updateTime DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_spaceId_userId (spaceId, userId),
    INDEX idx_spaceId (spaceId),
    INDEX idx_userId (userId)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = '空间用户关联';
