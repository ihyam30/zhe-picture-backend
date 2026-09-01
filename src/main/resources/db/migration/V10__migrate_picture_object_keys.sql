-- 历史版本曾把完整 COS URL 存在 url/thumbnailUrl 中，迁移为可直接删除的对象 key。
-- 图片可能按空间动态分表，因此同时处理 picture 和 picture_{spaceId}。
DROP PROCEDURE IF EXISTS migrate_picture_object_keys;
DELIMITER $$
CREATE PROCEDURE migrate_picture_object_keys()
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
    migrate_loop: LOOP
        FETCH table_cursor INTO v_table_name;
        IF done = 1 THEN
            LEAVE migrate_loop;
        END IF;

        SET @sql = CONCAT(
                'UPDATE `', v_table_name,
                '` SET objectKey = TRIM(BOTH ''/'' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING(url, CHAR_LENGTH(SUBSTRING_INDEX(url, ''/'', 3)) + 2), ''?'', 1), ''#'', 1)) ',
                'WHERE objectKey IS NULL AND url IS NOT NULL'
            );
        PREPARE migrate_original FROM @sql;
        EXECUTE migrate_original;
        DEALLOCATE PREPARE migrate_original;

        SET @sql = CONCAT(
                'UPDATE `', v_table_name,
                '` SET thumbnailObjectKey = TRIM(BOTH ''/'' FROM SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING(thumbnailUrl, CHAR_LENGTH(SUBSTRING_INDEX(thumbnailUrl, ''/'', 3)) + 2), ''?'', 1), ''#'', 1)) ',
                'WHERE thumbnailObjectKey IS NULL AND thumbnailUrl IS NOT NULL'
            );
        PREPARE migrate_thumbnail FROM @sql;
        EXECUTE migrate_thumbnail;
        DEALLOCATE PREPARE migrate_thumbnail;
    END LOOP;
    CLOSE table_cursor;
END$$
DELIMITER ;
CALL migrate_picture_object_keys();
DROP PROCEDURE migrate_picture_object_keys;
