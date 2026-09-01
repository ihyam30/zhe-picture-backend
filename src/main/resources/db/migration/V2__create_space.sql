CREATE TABLE IF NOT EXISTS space
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
    spaceName     VARCHAR(128)                       NULL COMMENT '空间名称',
    spaceLevel    INT      DEFAULT 0                 NULL COMMENT '空间级别：0-普通版 1-专业版 2-旗舰版',
    spaceType     INT      DEFAULT 0                 NOT NULL COMMENT '空间类型：0-私有 1-团队',
    maxSize       BIGINT   DEFAULT 0                 NULL COMMENT '空间图片的最大总大小',
    maxCount      BIGINT   DEFAULT 0                 NULL COMMENT '空间图片的最大数量',
    totalSize     BIGINT   DEFAULT 0                 NULL COMMENT '当前空间下图片的总大小',
    totalCount    BIGINT   DEFAULT 0                 NULL COMMENT '当前空间下的图片数量',
    reservedSize  BIGINT   DEFAULT 0                 NOT NULL COMMENT '上传中的容量预留',
    reservedCount BIGINT   DEFAULT 0                 NOT NULL COMMENT '上传中的数量预留',
    userId        BIGINT                              NOT NULL COMMENT '创建用户 id',
    createTime    DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    editTime      DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '编辑时间',
    updateTime    DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    isDelete      TINYINT  DEFAULT 0                 NOT NULL COMMENT '是否删除',
    INDEX idx_userId (userId),
    INDEX idx_spaceName (spaceName),
    INDEX idx_spaceLevel (spaceLevel),
    INDEX idx_spaceType (spaceType)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = '空间';
