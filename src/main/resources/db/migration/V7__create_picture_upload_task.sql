CREATE TABLE IF NOT EXISTS picture_upload_task
(
    id                   BIGINT       NOT NULL PRIMARY KEY,
    pictureId            BIGINT       NULL COMMENT '图片 id',
    oldPictureId         BIGINT       NULL COMMENT '被替换的旧图片 id；新增上传为空',
    userId               BIGINT       NOT NULL COMMENT '用户 id',
    spaceId              BIGINT       NULL COMMENT '空间 id',
    idempotencyKey       VARCHAR(128) NOT NULL COMMENT '幂等号',
    objectKey            VARCHAR(512) NOT NULL COMMENT '待上传原图 key',
    thumbnailObjectKey   VARCHAR(512) NULL COMMENT '待上传缩略图 key',
    compressedObjectKey  VARCHAR(512) NULL COMMENT '待上传压缩图 key',
    picSize              BIGINT       NOT NULL COMMENT '新图片大小',
    oldObjectKey         VARCHAR(512) NULL COMMENT '旧原图 key',
    oldThumbnailObjectKey VARCHAR(512) NULL COMMENT '旧缩略图 key',
    oldCompressedObjectKey VARCHAR(512) NULL COMMENT '旧压缩图 key',
    oldPicSize           BIGINT       NULL COMMENT '旧图片大小',
    status               VARCHAR(32)  NOT NULL COMMENT '任务状态',
    retryCount           INT          NOT NULL DEFAULT 0,
    lastError            VARCHAR(512) NULL,
    createTime           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateTime           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_upload_task_user_idempotency (userId, idempotencyKey),
    INDEX idx_upload_task_status_time (status, createTime),
    INDEX idx_upload_task_picture (pictureId)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci
  COMMENT = '图片上传任务';
