-- ============================================================
-- 毛茸茸星球 (Maozz Pet) 数据库初始化脚本
-- 创建时间: 2026-06-21
-- 数据库: MySQL 8.0+
-- ============================================================

-- 使用已有数据库
USE pet;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希(bcrypt)',
  avatar VARCHAR(20) DEFAULT '🐱' COMMENT '头像emoji',
  avatar_url VARCHAR(500) DEFAULT NULL COMMENT '头像图片URL',
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user' COMMENT '角色',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1=正常, 0=禁用',
  last_login_at DATETIME DEFAULT NULL COMMENT '最后登录时间',
  last_login_ip VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. 宠物档案表
-- ============================================================
CREATE TABLE IF NOT EXISTS pets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '主人用户ID',
  pet_name VARCHAR(50) NOT NULL COMMENT '宠物昵称',
  pet_type ENUM('cat', 'dog', 'rabbit', 'hamster', 'bird', 'fish', 'reptile', 'other') NOT NULL COMMENT '宠物类型',
  breed VARCHAR(50) DEFAULT NULL COMMENT '品种',
  gender ENUM('male', 'female', 'unknown') DEFAULT 'unknown' COMMENT '性别',
  birthday DATE DEFAULT NULL COMMENT '生日',
  weight DECIMAL(5,2) DEFAULT NULL COMMENT '体重(kg)',
  avatar_url VARCHAR(500) DEFAULT NULL COMMENT '宠物头像URL',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_pet_type (pet_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='宠物档案表';

-- ============================================================
-- 3. 帖子表
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '作者用户ID',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '正文内容',
  post_type ENUM('forum', 'knowledge', 'story') NOT NULL DEFAULT 'forum' COMMENT '帖子类型',
  category VARCHAR(50) DEFAULT NULL COMMENT '二级分类(如: 养宠求助, 日常分享, 好物推荐等)',
  tags VARCHAR(500) DEFAULT NULL COMMENT '标签(逗号分隔)',
  view_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览量',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  comment_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论数',
  is_pinned TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶: 1=是',
  is_featured TINYINT NOT NULL DEFAULT 0 COMMENT '是否精选: 1=是',
  status ENUM('published', 'draft', 'hidden', 'deleted') NOT NULL DEFAULT 'published' COMMENT '状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_post_type (post_type),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_is_pinned (is_pinned),
  INDEX idx_created_at (created_at),
  FULLTEXT INDEX ft_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- ============================================================
-- 4. 帖子媒体表（图片/视频）
-- ============================================================
CREATE TABLE IF NOT EXISTS post_media (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id INT UNSIGNED NOT NULL COMMENT '帖子ID',
  media_type ENUM('image', 'video') NOT NULL COMMENT '媒体类型',
  media_url VARCHAR(500) NOT NULL COMMENT '文件URL',
  thumbnail_url VARCHAR(500) DEFAULT NULL COMMENT '缩略图URL',
  file_size BIGINT UNSIGNED DEFAULT NULL COMMENT '文件大小(字节)',
  mime_type VARCHAR(50) DEFAULT NULL COMMENT 'MIME类型',
  sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子媒体表';

-- ============================================================
-- 5. 评论表
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id INT UNSIGNED NOT NULL COMMENT '帖子ID',
  user_id INT UNSIGNED NOT NULL COMMENT '评论者用户ID',
  parent_id INT UNSIGNED DEFAULT NULL COMMENT '父评论ID(用于楼中楼)',
  content TEXT NOT NULL COMMENT '评论内容',
  like_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞数',
  status ENUM('normal', 'hidden', 'deleted') NOT NULL DEFAULT 'normal' COMMENT '状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================================
-- 6. 留言表
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL COMMENT '留言者用户ID(游客为NULL)',
  nickname VARCHAR(50) DEFAULT NULL COMMENT '游客昵称',
  content TEXT NOT NULL COMMENT '留言内容',
  ip VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  status ENUM('normal', 'hidden', 'deleted') NOT NULL DEFAULT 'normal' COMMENT '状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='留言表';

-- ============================================================
-- 7. 用户点赞表
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_post_user (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';

-- ============================================================
-- 8. 评论点赞表
-- ============================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  comment_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_comment_user (comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论点赞表';

-- ============================================================
-- 9. 系统配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  setting_value TEXT COMMENT '配置值',
  setting_group VARCHAR(50) DEFAULT 'general' COMMENT '配置分组',
  description VARCHAR(200) DEFAULT NULL COMMENT '说明',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key),
  INDEX idx_setting_group (setting_group)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================================
-- 10. 操作日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL COMMENT '管理员用户ID',
  action VARCHAR(50) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) DEFAULT NULL COMMENT '目标类型(user/post/comment/message)',
  target_id INT UNSIGNED DEFAULT NULL COMMENT '目标ID',
  detail TEXT DEFAULT NULL COMMENT '操作详情',
  ip VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- ============================================================
-- 初始数据
-- ============================================================

-- 初始系统配置
INSERT INTO site_settings (setting_key, setting_value, setting_group, description) VALUES
('site_name', '毛茸茸星球', 'general', '网站名称'),
('site_description', '专为00后铲屎官打造的宠物社区', 'general', '网站描述'),
('site_url', 'http://localhost:3000', 'general', '网站URL'),
('site_keywords', '铲屎官,养宠攻略,宠物问答,宠物论坛,萌宠故事', 'seo', 'SEO关键词'),
('adsense_enabled', 'true', 'adsense', '是否启用AdSense'),
('adsense_client_id', 'pub-XXXXXXXXXXXXXXXX', 'adsense', 'AdSense客户ID'),
('allow_register', 'true', 'general', '是否允许注册'),
('default_avatar', '🐱', 'general', '默认头像emoji'),
('posts_per_page', '10', 'display', '每页帖子数'),
('comments_per_page', '20', 'display', '每页评论数');

-- 初始管理员账号（密码: Admin@2026 的bcrypt哈希）
-- 注意：实际部署时应在应用启动时通过bcrypt动态生成
INSERT INTO users (username, email, password_hash, avatar, role, status) VALUES
('admin', 'admin@maozz.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '🛡️', 'admin', 1);

-- ============================================================
-- 视图：数据看板统计
-- ============================================================
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE status = 1) AS total_users,
  (SELECT COUNT(*) FROM users WHERE role = 'user' AND status = 1 AND DATE(created_at) = CURDATE()) AS new_users_today,
  (SELECT COUNT(*) FROM posts WHERE status = 'published') AS total_posts,
  (SELECT COUNT(*) FROM posts WHERE status = 'published' AND DATE(created_at) = CURDATE()) AS new_posts_today,
  (SELECT COUNT(*) FROM comments WHERE status = 'normal') AS total_comments,
  (SELECT COUNT(*) FROM comments WHERE status = 'normal' AND DATE(created_at) = CURDATE()) AS new_comments_today,
  (SELECT COUNT(*) FROM messages WHERE status = 'normal') AS total_messages,
  (SELECT COUNT(*) FROM pets WHERE is_deleted = 0) AS total_pets,
  (SELECT COALESCE(SUM(view_count), 0) FROM posts) AS total_views,
  (SELECT COALESCE(SUM(like_count), 0) FROM posts) AS total_likes;

-- ============================================================
-- 视图：热门帖子
-- ============================================================
CREATE OR REPLACE VIEW v_hot_posts AS
SELECT
  p.id, p.title, p.post_type, p.view_count, p.like_count, p.comment_count,
  u.username, u.avatar,
  p.created_at
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.status = 'published'
ORDER BY p.view_count DESC, p.like_count DESC
LIMIT 20;

-- 完成
SELECT 'Database initialization completed successfully!' AS result;
