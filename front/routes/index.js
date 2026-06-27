const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../shared/models');

const SITE_URL = process.env.SITE_URL || 'https://www.maozz.online';

// ============ SEO 路由 ============

// sitemap.xml 动态生成
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const posts = await query(`SELECT id, title, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1000`);
    const staticPages = [
      '', '/forum', '/knowledge', '/stories', '/tools',
      '/about', '/contact', '/msgboard', '/login', '/register', '/petprofile'
    ];
    const today = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${SITE_URL}${p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${p === '' ? '1.0' : '0.7'}</priority>\n  </url>\n`;
    });
    posts.forEach(p => {
      const slug = p.title.replace(/[<>"'&]/g, '').substring(0, 50);
      xml += `  <url>\n    <loc>${SITE_URL}/post/${p.id}</loc>\n    <lastmod>${(p.updated_at || today).toISOString().split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });
    xml += '</urlset>';
    res.type('application/xml').send(xml);
  } catch (err) { next(err); }
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

// ============ 页面路由 ============

// 页面路由 - 传递基础数据给模板
router.get('/', async (req, res, next) => {
  try {
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

router.get('/forum', (req, res) => res.render('forum', { title: '宠物论坛 - 毛茸茸星球', metaDesc: '毛茸茸星球宠物论坛，铲屎官交流养宠经验、分享萌宠日常的在线社区' }));
router.get('/knowledge', (req, res) => res.render('knowledge', { title: '养宠百科 - 毛茸茸星球', metaDesc: '养宠百科知识库，涵盖猫、狗、兔、仓鼠、鸟类等宠物养护知识' }));
router.get('/stories', (req, res) => res.render('stories', { title: '萌宠故事 - 毛茸茸星球', metaDesc: '分享你与毛孩子的温馨故事，记录养宠生活中的点点滴滴' }));
router.get('/tools', (req, res) => res.render('tools', { title: '养宠工具箱 - 毛茸茸星球', metaDesc: '宠物年龄计算、喂食量计算、BMI健康评估、驱虫提醒等实用养宠工具' }));
router.get('/login', (req, res) => res.render('login', { title: '登录 - 毛茸茸星球', metaDesc: '登录毛茸茸星球，加入铲屎官社区' }));
router.get('/register', (req, res) => res.render('register', { title: '注册 - 毛茸茸星球', metaDesc: '注册毛茸茸星球账号，开启你的养宠之旅' }));
router.get('/msgboard', (req, res) => res.render('msgboard', { title: '留言板 - 毛茸茸星球', metaDesc: '毛茸茸星球留言板，留下你对宠物社区的建议和反馈' }));
router.get('/about', (req, res) => res.render('about', { title: '关于我们 - 毛茸茸星球', metaDesc: '了解毛茸茸星球——专为铲屎官打造的宠物社区平台' }));
router.get('/contact', (req, res) => res.render('contact', { title: '联系我们 - 毛茸茸星球', metaDesc: '联系毛茸茸星球团队，合作咨询与问题反馈' }));
router.get('/privacy', (req, res) => res.render('privacy', { title: '隐私政策 - 毛茸茸星球' }));
router.get('/disclaimer', (req, res) => res.render('disclaimer', { title: '免责声明 - 毛茸茸星球' }));
router.get('/terms', (req, res) => res.render('terms', { title: '使用条款 - 毛茸茸星球' }));
router.get('/search', (req, res) => res.render('search', { title: '搜索结果 - 毛茸茸星球', keyword: req.query.q || '', metaDesc: `搜索${req.query.q || ''}相关的宠物内容 - 毛茸茸星球` }));
router.get('/petprofile', (req, res) => res.render('petprofile', { title: '我的毛孩子 - 毛茸茸星球', metaDesc: '管理你的宠物档案，记录毛孩子的成长点滴' }));

// 帖子详情页
router.get('/post/:id', async (req, res, next) => {
  try {
    const post = await queryOne(
      `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.status = 'published'`, [req.params.id]
    );
    if (!post) return res.status(404).render('index', { title: '帖子未找到 - 毛茸茸星球' });

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

    const relatedPosts = await query(
      `SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.status = 'published' AND p.id != ? AND p.post_type = ? ORDER BY p.created_at DESC LIMIT 5`,
      [req.params.id, post.post_type]
    );

    // 为文章详情页生成 SEO 数据
    const excerpt = post.summary || (post.content || '').replace(/<[^>]*>/g, '').substring(0, 160);
    const coverImage = media.length > 0 ? `${SITE_URL}/uploads/${media[0].file_path}` : '';
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": excerpt,
      "author": { "@type": "Person", "name": post.username },
      "datePublished": post.created_at,
      "dateModified": post.updated_at || post.created_at,
      "publisher": { "@type": "Organization", "name": "毛茸茸星球", "url": SITE_URL }
    });

    res.render('post', {
      title: `${post.title} - 毛茸茸星球`,
      metaDesc: excerpt,
      metaKeywords: `宠物,${post.title.replace(/[<>"'&]/g, '')},毛茸茸星球`,
      canonicalUrl: `${SITE_URL}/post/${post.id}`,
      ogType: 'article',
      ogImage: coverImage,
      structuredData,
      post, media, comments, relatedPosts
    });
  } catch (err) { next(err); }
});

// API路由
const authRoutes = require('./auth');
const postRoutes = require('./posts');
const commentRoutes = require('./comments');
const messageRoutes = require('./messages');
const uploadRoutes = require('./upload');
const toolRoutes = require('./tools');

router.use('/api/auth', authRoutes);
router.use('/api/posts', postRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/messages', messageRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/tools', toolRoutes);

module.exports = router;
