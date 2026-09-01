-- picture 支持按空间动态创建 picture_{spaceId} 分表，所有现有物理表都需要补齐索引。
DROP PROCEDURE IF EXISTS add_picture_indexes;
DELIMITER $$
CREATE PROCEDURE add_picture_indexes()
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
    index_loop: LOOP
        FETCH table_cursor INTO v_table_name;
        IF done = 1 THEN
            LEAVE index_loop;
        END IF;

        SET @index_exists = (SELECT COUNT(*)
                             FROM information_schema.STATISTICS
                             WHERE TABLE_SCHEMA = DATABASE()
                               AND TABLE_NAME = v_table_name
                               AND INDEX_NAME = 'idx_space_status');
        IF @index_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name,
                              '` ADD INDEX `idx_space_status` (`spaceId`, `reviewStatus`, `isDelete`)');
            PREPARE add_index FROM @sql;
            EXECUTE add_index;
            DEALLOCATE PREPARE add_index;
        END IF;

        SET @index_exists = (SELECT COUNT(*)
                             FROM information_schema.STATISTICS
                             WHERE TABLE_SCHEMA = DATABASE()
                               AND TABLE_NAME = v_table_name
                               AND INDEX_NAME = 'idx_space_edit_time');
        IF @index_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name,
                              '` ADD INDEX `idx_space_edit_time` (`spaceId`, `editTime`)');
            PREPARE add_index FROM @sql;
            EXECUTE add_index;
            DEALLOCATE PREPARE add_index;
        END IF;

        SET @index_exists = (SELECT COUNT(*)
                             FROM information_schema.STATISTICS
                             WHERE TABLE_SCHEMA = DATABASE()
                               AND TABLE_NAME = v_table_name
                               AND INDEX_NAME = 'idx_user_create_time');
        IF @index_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name,
                              '` ADD INDEX `idx_user_create_time` (`userId`, `createTime`)');
            PREPARE add_index FROM @sql;
            EXECUTE add_index;
            DEALLOCATE PREPARE add_index;
        END IF;

        SET @index_exists = (SELECT COUNT(*)
                             FROM information_schema.STATISTICS
                             WHERE TABLE_SCHEMA = DATABASE()
                               AND TABLE_NAME = v_table_name
                               AND INDEX_NAME = 'uk_picture_user_idempotency');
        IF @index_exists = 0 THEN
            SET @sql = CONCAT('ALTER TABLE `', v_table_name,
                              '` ADD UNIQUE INDEX `uk_picture_user_idempotency` (`userId`, `idempotencyKey`)');
            PREPARE add_index FROM @sql;
            EXECUTE add_index;
            DEALLOCATE PREPARE add_index;
        END IF;
    END LOOP;
    CLOSE table_cursor;
END$$
DELIMITER ;
CALL add_picture_indexes();
DROP PROCEDURE add_picture_indexes;
