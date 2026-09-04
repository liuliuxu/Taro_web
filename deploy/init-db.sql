-- =============================================================================
-- 重工机械商城 - MySQL 生产数据库初始化
-- 在服务器 MySQL 中执行: sudo mysql < init-db.sql
-- 请修改密码为强密码，并同步到 systemd 服务 / deploy 脚本
-- =============================================================================

CREATE DATABASE IF NOT EXISTS heavymachinery
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 后端专用数据库账号（请替换强密码）
CREATE USER IF NOT EXISTS 'heavy'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON heavymachinery.* TO 'heavy'@'localhost';
FLUSH PRIVILEGES;
