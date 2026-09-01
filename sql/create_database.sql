-- Flyway 不负责创建 MySQL 数据库本身。
-- 首次部署前由 DBA 执行一次，应用随后通过 Flyway 管理表结构。
CREATE DATABASE IF NOT EXISTS zhe_picture
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
