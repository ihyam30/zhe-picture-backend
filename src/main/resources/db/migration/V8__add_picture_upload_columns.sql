-- 兼容从阶段一数据库直接接入 Flyway 的场景。
-- 新库在 V3/V2 已经包含这些字段；这里也为历史动态分表逐列补齐第二阶段字段。
DROP PROCEDURE IF EXISTS add_picture_upload_columns;
DELIMITER $$
CREATE PROCEDURE add_picture_upload_columns()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_table_name VARCHAR(128);
    DECLARE table_cursor CURSOR FOR
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND (TABLE_NAME = 'picture' OR TABLE_NAME REGEXP '^picture_[0-9]+$');
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN table_cursor;
    column_loop: LOOP
        FETCH table_cursor INTO v_table_name;
        IF done = 1 THEN
            LEAVE column_loop;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'objectKey');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `objectKey` VARCHAR(512) NULL');
            PREPARE add_object_key FROM @sql;
            EXECUTE add_object_key;
            DEALLOCATE PREPARE add_object_key;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'thumbnailObjectKey');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `thumbnailObjectKey` VARCHAR(512) NULL');
            PREPARE add_thumbnail_object_key FROM @sql;
            EXECUTE add_thumbnail_object_key;
            DEALLOCATE PREPARE add_thumbnail_object_key;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'compressedObjectKey');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `compressedObjectKey` VARCHAR(512) NULL');
            PREPARE add_compressed_object_key FROM @sql;
            EXECUTE add_compressed_object_key;
            DEALLOCATE PREPARE add_compressed_object_key;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'uploadStatus');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name,
                              '` ADD COLUMN `uploadStatus` VARCHAR(32) NOT NULL DEFAULT ''READY''');
            PREPARE add_upload_status FROM @sql;
            EXECUTE add_upload_status;
            DEALLOCATE PREPARE add_upload_status;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'contentType');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `contentType` VARCHAR(128) NULL');
            PREPARE add_content_type FROM @sql;
            EXECUTE add_content_type;
            DEALLOCATE PREPARE add_content_type;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'etag');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `etag` VARCHAR(128) NULL');
            PREPARE add_etag FROM @sql;
            EXECUTE add_etag;
            DEALLOCATE PREPARE add_etag;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'version');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `version` INT NOT NULL DEFAULT 0');
            PREPARE add_version FROM @sql;
            EXECUTE add_version;
            DEALLOCATE PREPARE add_version;
        END IF;

        SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = v_table_name
                                AND COLUMN_NAME = 'idempotencyKey');
        IF @column_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name, '` ADD COLUMN `idempotencyKey` VARCHAR(128) NULL');
            PREPARE add_idempotency_key FROM @sql;
            EXECUTE add_idempotency_key;
            DEALLOCATE PREPARE add_idempotency_key;
        END IF;

        SET @sql = CONCAT('UPDATE `', v_table_name,
                          '` SET `uploadStatus` = ''READY'' WHERE `uploadStatus` IS NULL');
        PREPARE normalize_status FROM @sql;
        EXECUTE normalize_status;
        DEALLOCATE PREPARE normalize_status;

        SET @sql = CONCAT('UPDATE `', v_table_name,
                          '` SET `version` = 0 WHERE `version` IS NULL');
        PREPARE normalize_version FROM @sql;
        EXECUTE normalize_version;
        DEALLOCATE PREPARE normalize_version;
    END LOOP;
    CLOSE table_cursor;

    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'space'
                            AND COLUMN_NAME = 'reservedSize');
    IF @column_exists = 0 THEN
        SET @sql = 'ALTER TABLE `space` ADD COLUMN `reservedSize` BIGINT NOT NULL DEFAULT 0 COMMENT ''上传中的容量预留''';
        PREPARE add_reserved_size FROM @sql;
        EXECUTE add_reserved_size;
        DEALLOCATE PREPARE add_reserved_size;
    END IF;

    SET @column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
                          WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'space'
                            AND COLUMN_NAME = 'reservedCount');
    IF @column_exists = 0 THEN
        SET @sql = 'ALTER TABLE `space` ADD COLUMN `reservedCount` BIGINT NOT NULL DEFAULT 0 COMMENT ''上传中的数量预留''';
        PREPARE add_reserved_count FROM @sql;
        EXECUTE add_reserved_count;
        DEALLOCATE PREPARE add_reserved_count;
    END IF;

    UPDATE space SET reservedSize = 0 WHERE reservedSize IS NULL;
    UPDATE space SET reservedCount = 0 WHERE reservedCount IS NULL;
END$$
DELIMITER ;
CALL add_picture_upload_columns();
DROP PROCEDURE add_picture_upload_columns;
