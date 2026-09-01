-- 第二阶段：图片上传链路、幂等、配额预留和 Outbox
-- 请在实际业务库（当前 application.yml 为 zhe_picture）中执行。

ALTER TABLE picture
    ADD COLUMN IF NOT EXISTS objectKey VARCHAR(512) NULL COMMENT '原图 COS 对象 key',
    ADD COLUMN IF NOT EXISTS thumbnailObjectKey VARCHAR(512) NULL COMMENT '缩略图 COS 对象 key',
    ADD COLUMN IF NOT EXISTS compressedObjectKey VARCHAR(512) NULL COMMENT '压缩图 COS 对象 key',
    ADD COLUMN IF NOT EXISTS uploadStatus VARCHAR(32) NOT NULL DEFAULT 'READY' COMMENT '上传状态',
    ADD COLUMN IF NOT EXISTS contentType VARCHAR(128) NULL COMMENT '实际内容类型',
    ADD COLUMN IF NOT EXISTS etag VARCHAR(128) NULL COMMENT 'COS ETag',
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本',
    ADD COLUMN IF NOT EXISTS idempotencyKey VARCHAR(128) NULL COMMENT '上传幂等号';

ALTER TABLE space
    ADD COLUMN IF NOT EXISTS reservedSize BIGINT NOT NULL DEFAULT 0 COMMENT '上传中的容量预留',
    ADD COLUMN IF NOT EXISTS reservedCount BIGINT NOT NULL DEFAULT 0 COMMENT '上传中的数量预留';

UPDATE picture SET uploadStatus = 'READY' WHERE uploadStatus IS NULL;
UPDATE picture SET version = 0 WHERE version IS NULL;
UPDATE space SET reservedSize = 0 WHERE reservedSize IS NULL;
UPDATE space SET reservedCount = 0 WHERE reservedCount IS NULL;

-- 仅用于一次性迁移旧记录；新代码不再从 URL 解析 key。
UPDATE picture
SET objectKey = TRIM(BOTH '/' FROM SUBSTRING_INDEX(
        REGEXP_REPLACE(REGEXP_REPLACE(url, '^https?://[^/]+/?', ''), '\\?.*$', ''), '#', 1))
WHERE objectKey IS NULL AND url IS NOT NULL;
UPDATE picture
SET thumbnailObjectKey = TRIM(BOTH '/' FROM SUBSTRING_INDEX(
        REGEXP_REPLACE(REGEXP_REPLACE(thumbnailUrl, '^https?://[^/]+/?', ''), '\\?.*$', ''), '#', 1))
WHERE thumbnailObjectKey IS NULL AND thumbnailUrl IS NOT NULL;

-- 一次性执行；若索引已存在，请跳过这一句。
CREATE UNIQUE INDEX uk_picture_user_idempotency ON picture (userId, idempotencyKey);

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
) COMMENT '图片上传任务';

CREATE TABLE IF NOT EXISTS outbox_event
(
    id             BIGINT       NOT NULL PRIMARY KEY,
    eventType      VARCHAR(64)  NOT NULL COMMENT '事件类型',
    aggregateId    BIGINT       NULL COMMENT '聚合 id',
    dedupeKey      VARCHAR(192) NOT NULL COMMENT '幂等键',
    payload        TEXT         NOT NULL COMMENT '事件负载 JSON',
    status         VARCHAR(32)  NOT NULL COMMENT '事件状态',
    retryCount     INT          NOT NULL DEFAULT 0,
    nextRetryTime  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lockedUntil    DATETIME     NULL,
    lastError      VARCHAR(512) NULL,
    createTime     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updateTime     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_outbox_dedupeKey (dedupeKey),
    INDEX idx_outbox_poll (status, nextRetryTime, lockedUntil)
) COMMENT '事务 Outbox 事件';
