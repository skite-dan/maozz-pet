const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../models');
const { adminPageAuth } = require('../middlewares/auth');

// 页面路由 - 传递基础数据给模板
router.get('/', async (req, res, next) => {
  try {
    // 获取首页数据
    const [hotPosts, latestPosts, forumPosts, banners, stats] = await Promise.all([
      query(`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
             WHERE p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL) ORDER BY p.view_count DESC, p.like_count DESC LIMIT 6`),
      query(`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
             WHERE p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL) ORDER BY p.created_at DESC LIMIT 8`),
      query(`SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
             WHERE p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL) AND p.post_type = 'forum' ORDER BY p.created_at DESC LIMIT 5`),
      query(`SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC, id ASC LIMIT 5`),
      queryOne(`SELECT
        (SELECT COUNT(*) FROM posts WHERE status = 'published' AND DATE(created_at) = CURDATE()) as new_posts_today,
        (SELECT COUNT(*) FROM posts WHERE status = 'published' AND category IN ('cat-disease','dog-disease','medical-help') AND comment_count = 0) as pending_medical`)
    ]);
    res.render('index', {
      title: '毛茸茸星球-专业铲屎官宠物交流论坛 | 养猫养狗饲养问诊同城领养',
      metaDesc: '毛茸茸星球是铲屎官专属宠物社区，分享猫狗饲养干货、宠物疾病问诊、同城遛宠、无偿领养、宠物用品闲置交流，百万养宠经验免费查阅，一站式解决养宠难题。',
      metaKeywords: '宠物论坛,养猫攻略,养狗教程,猫咪疾病,同城宠物领养,宠物交流社区',
      hotPosts, latestPosts, forumPosts, banners, stats
    });
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
       WHERE p.id = ? AND p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL)`, [req.params.id]
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

    // 为SEO生成结构化数据
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 150) : '',
      "author": { "@type": "Person", "name": post.username || '匿名' },
      "datePublished": post.created_at,
      "dateModified": post.updated_at,
      "image": media && media.length > 0 ? media[0].media_url : undefined
    });
    res.render('post', {
      title: post.title + ' - 毛茸茸星球',
      metaDesc: (post.content ? post.content.replace(/<[^>]+>/g, '').substring(0, 150) : ''),
      metaKeywords: (post.tags ? post.tags : '宠物论坛,养宠攻略') + ',毛茸茸星球',
      canonicalUrl: (process.env.SITE_URL || 'http://localhost:3000') + '/post/' + post.id,
      ogType: 'article',
      ogImage: media && media.length > 0 ? media[0].media_url : undefined,
      structuredData: structuredData,
      post, media, comments, relatedPosts
    });
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

// SEO - sitemap.xml
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const posts = await query(`SELECT id, title, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1000`);
    const categories = [
      'cat-feed','dog-feed','exotic-pet','food-review','product-review',
      'cat-disease','dog-disease','daily-care','medical-help',
      'city-adoption','city-breed','lost-found','city-walk',
      'daily-show','pet-contest','fun-topic',
      'secondhand','pet-transfer','service',
      'behavior-help','blacklist','rescue'
    ];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>';
    xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/forum</loc><changefreq>daily</changefreq><priority>0.9</priority></url>';
    xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/knowledge</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>';
    xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/stories</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>';
    xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/tools</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>';
    categories.forEach(cat => {
      xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/forum?category=' + encodeURIComponent(cat) + '</loc><changefreq>daily</changefreq><priority>0.8</priority></url>';
    });
    posts.forEach(p => {
      xml += '<url><loc>' + (process.env.SITE_URL || 'http://localhost:3000') + '/post/' + p.id + '</loc><lastmod>' + new Date(p.updated_at).toISOString().split('T')[0] + '</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>';
    });
    xml += '</urlset>';
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { next(err); }
});

// SEO - robots.txt
router.get('/robots.txt', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  res.type('text/plain');
  res.send(
    'User-agent: *\n' +
    'Allow: /\n' +
    'Disallow: /admin\n' +
    'Disallow: /api/\n' +
    'Disallow: /login\n' +
    'Disallow: /register\n' +
    'Disallow: /uploads/\n' +
    'Sitemap: ' + siteUrl + '/sitemap.xml\n'
  );
});

module.exports = router;
