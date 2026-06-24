const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../models');
const { adminPageAuth } = require('../middlewares/auth');

// 页面路由 - 传递基础数据给模板
router.get('/', async (req, res, next) => {
  try {
    // 获取首页数据
    const [hotPosts, latestPosts, forumPosts, banners] = await Promise.all([
      query(`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
             WHERE p.status = 'published' ORDER BY p.view_count DESC, p.like_count DESC LIMIT 6`),
      query(`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
             WHERE p.status = 'published' ORDER BY p.created_at DESC LIMIT 8`),
      query(`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
             WHERE p.status = 'published' AND p.post_type = 'forum' ORDER BY p.created_at DESC LIMIT 5`),
      query(`SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC, id ASC LIMIT 5`),
    ]);
    res.render('index', { title: '铲屎官必备 | 毛茸茸星球 — 养宠攻略·宠物问答·萌宠社区', hotPosts, latestPosts, forumPosts, banners });
  } catch (err) { next(err); }
});

// 公共API - 获取轮播图
router.get('/api/banners', async (req, res, next) => {
  try {
    const banners = await query(
      'SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC, id ASC LIMIT 5'
    );
    res.json({ code: 200, data: banners });
  } catch (err) { next(err); }
});

router.get('/forum', (req, res) => res.render('forum', { title: '宠物论坛 - 毛茸茸星球' }));
router.get('/knowledge', (req, res) => res.render('knowledge', { title: '养宠百科 - 毛茸茸星球' }));
router.get('/stories', (req, res) => res.render('stories', { title: '萌宠故事 - 毛茸茸星球' }));
router.get('/tools', (req, res) => res.render('tools', { title: '养宠工具箱 - 毛茸茸星球' }));
router.get('/login', (req, res) => res.render('login', { title: '登录 - 毛茸茸星球' }));
router.get('/register', (req, res) => res.render('register', { title: '注册 - 毛茸茸星球' }));
router.get('/msgboard', (req, res) => res.render('msgboard', { title: '留言板 - 毛茸茸星球' }));
router.get('/about', (req, res) => res.render('about', { title: '关于我们 - 毛茸茸星球' }));
router.get('/contact', (req, res) => res.render('contact', { title: '联系我们 - 毛茸茸星球' }));
router.get('/privacy', (req, res) => res.render('privacy', { title: '隐私政策 - 毛茸茸星球' }));
router.get('/disclaimer', (req, res) => res.render('disclaimer', { title: '免责声明 - 毛茸茸星球' }));
router.get('/terms', (req, res) => res.render('terms', { title: '使用条款 - 毛茸茸星球' }));
router.get('/search', (req, res) => res.render('search', { title: '搜索结果 - 毛茸茸星球', keyword: req.query.q || '' }));
router.get('/petprofile', (req, res) => res.render('petprofile', { title: '我的毛孩子 - 毛茸茸星球' }));

// 帖子详情页
router.get('/post/:id', async (req, res, next) => {
  try {
    const post = await queryOne(
      `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.status = 'published'`, [req.params.id]
    );
    if (!post) return res.status(404).render('index', { title: '帖子未找到 - 毛茸茸星球' });

    // 增加浏览量
    await query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    post.view_count++;

    const media = await query('SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order', [req.params.id]);
    const comments = await query(
      `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'normal' AND c.parent_id IS NULL ORDER BY c.created_at ASC`, [req.params.id]
    );
    for (const comment of comments) {
      comment.replies = await query(
        `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.parent_id = ? AND c.status = 'normal' ORDER BY c.created_at ASC`, [comment.id]
      );
    }

    // 相关帖子
    const relatedPosts = await query(
      `SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.status = 'published' AND p.id != ? AND p.post_type = ? ORDER BY p.created_at DESC LIMIT 5`,
      [req.params.id, post.post_type]
    );

    res.render('post', { title: `${post.title} - 毛茸茸星球`, post, media, comments, relatedPosts });
  } catch (err) { next(err); }
});

// 管理后台页面路由
router.get('/admin', (req, res) => res.render('admin/login', { title: '管理后台登录 - 毛茸茸星球' }));
router.get('/admin/dashboard', adminPageAuth, (req, res) => res.render('admin/dashboard', { title: '数据看板 - 毛茸茸星球管理后台', adminUser: req.adminUser }));
// 用户管理 - 服务端注入初始数据
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
// 帖子管理 - 服务端注入初始数据
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

// 评论管理 - 服务端注入初始数据
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

// 留言管理 - 服务端注入初始数据
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
const postRoutes = require('./posts');
const commentRoutes = require('./comments');
const messageRoutes = require('./messages');
const uploadRoutes = require('./upload');
const adminRoutes = require('./admin');
const toolRoutes = require('./tools');

router.use('/api/auth', authRoutes);
router.use('/api/posts', postRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/tools', toolRoutes);

module.exports = router;
