const express = require('express');
const { query, queryOne } = require('../../shared/models');
const { admin } = require('../../shared/middlewares/admin');
const { success, error } = require('../../shared/utils/response');

const router = express.Router();

// 所有admin路由需要管理员权限
router.use(admin);

// 数据看板统计
router.get('/dashboard', async (req, res) => {
  try {
    const statsRow = await queryOne('SELECT * FROM v_dashboard_stats');

    // 将数据库下划线命名转换为前端驼峰命名
    const stats = {
      totalUsers: statsRow?.total_users || 0,
      newUsersToday: statsRow?.new_users_today || 0,
      totalPosts: statsRow?.total_posts || 0,
      newPostsToday: statsRow?.new_posts_today || 0,
      totalComments: statsRow?.total_comments || 0,
      newCommentsToday: statsRow?.new_comments_today || 0,
      totalMessages: statsRow?.total_messages || 0,
      totalPets: statsRow?.total_pets || 0,
      totalViews: statsRow?.total_views || 0,
      totalLikes: statsRow?.total_likes || 0,
    };

    const trend = await query(
      `SELECT DATE(created_at) as date, COUNT(*) as count FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND role = 'user'
       GROUP BY DATE(created_at) ORDER BY date`
    );

    const recentPosts = await query(
      `SELECT p.id, p.title, p.post_type, p.view_count, p.like_count, p.status, p.created_at, u.username
       FROM posts p JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 10`
    );

    const recentComments = await query(
      `SELECT c.id, c.content, c.status, c.created_at, u.username, p.title as post_title
       FROM comments c JOIN users u ON c.user_id = u.id
       JOIN posts p ON c.post_id = p.id
       ORDER BY c.created_at DESC LIMIT 10`
    );

    const { getVisitStats } = require('../../shared/services/visitTracker');
    const visitStats = await getVisitStats(30);

    success(res, { stats, trend, recentPosts, recentComments, visitStats });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 用户管理
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role, keyword } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1', params = [];
    if (status !== undefined && status !== '') { where += ' AND u.status = ?'; params.push(status); }
    if (role) { where += ' AND u.role = ?'; params.push(role); }
    if (keyword) { where += ' AND (u.username LIKE ? OR u.email LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

    const users = await query(
      `SELECT u.id, u.username, u.email, u.avatar, u.role, u.status, u.last_login_at, u.created_at,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
       FROM users u WHERE ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const totalResult = await queryOne(`SELECT COUNT(*) as total FROM users u WHERE ${where}`, params);
    success(res, { users, total: totalResult?.total || 0 });
  } catch (err) {
    return error(res, 500, err.message);
  }
});


// 编辑用户信息
router.put('/users/:id', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !username.trim()) return error(res, 400, '用户名不能为空');
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 20) return error(res, 400, '用户名长度需在2-20个字符之间');
    const existing = await queryOne('SELECT id FROM users WHERE username = ? AND id != ?', [trimmed, req.params.id]);
    if (existing) return error(res, 400, '该用户名已存在');
    if (email) {
      await query('UPDATE users SET username = ?, email = ? WHERE id = ?', [trimmed, email.trim(), req.params.id]);
    } else {
      await query('UPDATE users SET username = ? WHERE id = ?', [trimmed, req.params.id]);
    }
    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_user', 'user', req.params.id, req.ip]);
    success(res, null, '用户信息更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 禁用/启用用户
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (status === undefined) return error(res, 400, '请指定状态');
    await query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_user_status', 'user', req.params.id, req.ip]);
    success(res, null, '用户状态更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 帖子管理
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, keyword } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1', params = [];
    if (status !== undefined && status !== '') { where += ' AND p.status = ?'; params.push(status); }
    if (type) { where += ' AND p.post_type = ?'; params.push(type); }
    if (keyword) { where += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

    const posts = await query(
      `SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id
       WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const totalResult = await queryOne(`SELECT COUNT(*) as total FROM posts p WHERE ${where}`, params);
    success(res, { posts, total: totalResult?.total || 0 });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 更新帖子状态
router.put('/posts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE posts SET status = ? WHERE id = ?', [status, req.params.id]);
    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_post_status', 'post', req.params.id, req.ip]);
    success(res, null, '帖子状态更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 删除帖子
router.delete('/posts/:id', async (req, res) => {
  try {
    await query('UPDATE posts SET status = "deleted" WHERE id = ?', [req.params.id]);
    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'delete_post', 'post', req.params.id, req.ip]);
    success(res, null, '帖子已删除');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 获取帖子详情
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await queryOne(
      `SELECT p.*, u.username, u.email, u.avatar
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!post) return error(res, 404, '帖子不存在');

    const media = await query(
      'SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order',
      [req.params.id]
    );

    success(res, { post, media });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 新增帖子（管理员代发）
router.post('/posts', async (req, res) => {
  try {
    const { title, content, user_id, post_type, category, tags, status = 'published', is_pinned, is_featured } = req.body;
    if (!title || !content) return error(res, 400, '标题和内容不能为空');
    if (!user_id) return error(res, 400, '请选择发帖用户');

    // 验证用户存在
    const user = await queryOne('SELECT id, username FROM users WHERE id = ? AND status = 1', [user_id]);
    if (!user) return error(res, 400, '所选用户不存在或已禁用');

    const result = await query(
      'INSERT INTO posts (user_id, title, content, post_type, category, tags, status, is_pinned, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [user_id, title, content, post_type || 'forum', category || null, tags || null, status, is_pinned ? 1 : 0, is_featured ? 1 : 0]
    );

    // 处理媒体文件
    if (req.body.media && req.body.media.length > 0) {
      for (let i = 0; i < req.body.media.length; i++) {
        const m = req.body.media[i];
        await query(
          'INSERT INTO post_media (post_id, media_type, media_url, thumbnail_url, file_size, mime_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, m.type || m.media_type || 'image', m.url || m.media_url, m.thumbnail || m.thumbnail_url || null, m.size || m.file_size || null, m.mime || m.mime_type || null, i]
        );
      }
    }

    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'create_post', 'post', result.insertId, req.ip]);

    success(res, { id: result.insertId }, '帖子创建成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 更新帖子内容
router.put('/posts/:id', async (req, res) => {
  try {
    const { title, content, post_type, category, tags, status } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (post_type !== undefined) { updates.push('post_type = ?'); params.push(post_type); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(tags); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) return error(res, 400, '请提供要更新的字段');

    params.push(req.params.id);
    await query(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`, params);
    await query('INSERT INTO admin_logs (admin_id, action, target_type, target_id, ip) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_post', 'post', req.params.id, req.ip]);
    success(res, null, '帖子更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 更新帖子媒体
router.put('/posts/:id/media', async (req, res) => {
  try {
    const { media } = req.body;
    if (!Array.isArray(media)) return error(res, 400, 'media 必须是数组');

    // 删除旧媒体
    await query('DELETE FROM post_media WHERE post_id = ?', [req.params.id]);
    // 插入新媒体
    for (let i = 0; i < media.length; i++) {
      const m = media[i];
      await query(
        'INSERT INTO post_media (post_id, media_type, media_url, thumbnail_url, file_size, mime_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, m.type || m.media_type, m.url || m.media_url, m.thumbnail || m.thumbnail_url || null, m.size || m.file_size || null, m.mime || m.mime_type || null, i]
      );
    }
    success(res, null, '媒体更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 评论管理
router.get('/comments', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1', params = [];
    if (status !== undefined && status !== '') { where += ' AND c.status = ?'; params.push(status); }
    if (keyword) { where += ' AND c.content LIKE ?'; params.push(`%${keyword}%`); }

    const comments = await query(
      `SELECT c.*, u.username, p.title as post_title FROM comments c
       JOIN users u ON c.user_id = u.id
       JOIN posts p ON c.post_id = p.id
       WHERE ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const totalResult = await queryOne(`SELECT COUNT(*) as total FROM comments c WHERE ${where}`, params);
    success(res, { comments, total: totalResult?.total || 0 });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 隐藏/删除评论
router.put('/comments/:id/status', async (req, res) => {
  try {
    await query('UPDATE comments SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    success(res, null, '评论状态更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 留言管理
router.get('/messages', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1', params = [];
    if (status !== undefined && status !== '') { where += ' AND m.status = ?'; params.push(status); }
    if (keyword) { where += ' AND m.content LIKE ?'; params.push(`%${keyword}%`); }

    const messages = await query(
      `SELECT m.*, u.username FROM messages m LEFT JOIN users u ON m.user_id = u.id
       WHERE ${where} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const totalResult = await queryOne(`SELECT COUNT(*) as total FROM messages m WHERE ${where}`, params);
    success(res, { messages, total: totalResult?.total || 0 });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 隐藏/删除留言
router.put('/messages/:id/status', async (req, res) => {
  try {
    await query('UPDATE messages SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    success(res, null, '留言状态更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 系统配置
router.get('/settings', async (req, res) => {
  try {
    const settings = await query('SELECT * FROM site_settings ORDER BY setting_group, setting_key');
    success(res, settings);
  } catch (err) {
    return error(res, 500, err.message);
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await query('UPDATE site_settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
    }
    success(res, null, '配置更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 操作日志
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const logs = await query(
      `SELECT l.*, a.username as admin_name FROM admin_logs l JOIN users a ON l.admin_id = a.id
       ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    success(res, logs);
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 轮播图管理 - 列表
router.get('/banners', async (req, res) => {
  try {
    const banners = await query(
      'SELECT * FROM banners ORDER BY sort_order ASC, id ASC'
    );
    success(res, banners);
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 轮播图管理 - 创建
router.post('/banners', async (req, res) => {
  try {
    const { title, image_url, link_url, sort_order } = req.body;
    if (!image_url) return error(res, 400, '图片地址不能为空');

    const result = await query(
      'INSERT INTO banners (title, image_url, link_url, sort_order) VALUES (?, ?, ?, ?)',
      [title || '', image_url, link_url || '', sort_order || 0]
    );
    success(res, { id: result.insertId }, '轮播图添加成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 轮播图管理 - 更新
router.put('/banners/:id', async (req, res) => {
  try {
    const { title, image_url, link_url, sort_order, status } = req.body;
    await query(
      'UPDATE banners SET title = ?, image_url = ?, link_url = ?, sort_order = ?, status = ? WHERE id = ?',
      [title || '', image_url, link_url || '', sort_order || 0, status !== undefined ? status : 1, req.params.id]
    );
    success(res, null, '轮播图更新成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 轮播图管理 - 删除
router.delete('/banners/:id', async (req, res) => {
  try {
    await query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    success(res, null, '轮播图删除成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

module.exports = router;
