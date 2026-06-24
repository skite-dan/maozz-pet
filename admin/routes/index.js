const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../shared/models');
const { adminPageAuth } = require('../../shared/middlewares/auth');

// 管理后台登录页
router.get('/admin', (req, res) => res.render('admin/login', { title: '管理后台登录 - 毛茸茸星球' }));

// 管理后台页面路由（需要页面认证）
router.get('/admin/dashboard', adminPageAuth, (req, res) => res.render('admin/dashboard', { title: '数据看板 - 毛茸茸星球管理后台', adminUser: req.adminUser }));

router.get('/admin/users', adminPageAuth, async (req, res, next) => {
  try {
    const users = await query(
      `SELECT u.id, u.username, u.email, u.avatar, u.role, u.status, u.last_login_at, u.created_at,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) as post_count
       FROM users u ORDER BY u.created_at DESC LIMIT 10`
    );
    const totalResult = await queryOne('SELECT COUNT(*) as total FROM users');
    res.render('admin/users', {
      title: '用户管理 - 毛茸茸星球管理后台',
      adminUser: req.adminUser,
      initialData: { users: users || [], total: totalResult ? totalResult.total : 0 }
    });
  } catch (err) { next(err); }
});

router.get('/admin/posts', adminPageAuth, async (req, res, next) => {
  try {
    const posts = await query(
      `SELECT p.*, u.username, u.avatar
       FROM posts p LEFT JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC LIMIT 10`
    );
    const totalResult = await queryOne('SELECT COUNT(*) as total FROM posts');
    res.render('admin/posts', {
      title: '帖子管理 - 毛茸茸星球管理后台',
      adminUser: req.adminUser,
      initialData: { posts: posts || [], total: totalResult ? totalResult.total : 0 }
    });
  } catch (err) { next(err); }
});

router.get('/admin/comments', adminPageAuth, async (req, res, next) => {
  try {
    const comments = await query(
      `SELECT c.*, u.username, u.avatar, p.title as post_title
       FROM comments c LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN posts p ON c.post_id = p.id
       ORDER BY c.created_at DESC LIMIT 10`
    );
    const totalResult = await queryOne('SELECT COUNT(*) as total FROM comments');
    res.render('admin/comments', {
      title: '评论管理 - 毛茸茸星球管理后台',
      adminUser: req.adminUser,
      initialData: { comments: comments || [], total: totalResult ? totalResult.total : 0 }
    });
  } catch (err) { next(err); }
});

router.get('/admin/messages', adminPageAuth, async (req, res, next) => {
  try {
    const messages = await query(
      `SELECT m.*, u.username, u.avatar
       FROM messages m LEFT JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC LIMIT 10`
    );
    const totalResult = await queryOne('SELECT COUNT(*) as total FROM messages');
    res.render('admin/messages', {
      title: '留言管理 - 毛茸茸星球管理后台',
      adminUser: req.adminUser,
      initialData: { messages: messages || [], total: totalResult ? totalResult.total : 0 }
    });
  } catch (err) { next(err); }
});

router.get('/admin/settings', adminPageAuth, (req, res) => res.render('admin/settings', { title: '系统设置 - 毛茸茸星球管理后台', adminUser: req.adminUser }));
router.get('/admin/banners', adminPageAuth, (req, res) => res.render('admin/banners', { title: '轮播图管理 - 毛茸茸星球管理后台', adminUser: req.adminUser }));

// API路由
const authRoutes = require('./auth');
const adminRoutes = require('./admin');

router.use('/api/auth', authRoutes);
router.use('/api/admin', adminRoutes);

module.exports = router;
