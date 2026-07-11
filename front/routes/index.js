const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../../shared/models');

const SITE_URL = process.env.SITE_URL || 'https://www.maozz.online';

// 将 siteUrl 注入所有模板
router.use((req, res, next) => {
  res.locals.siteUrl = SITE_URL;
  next();
});

// ============ SEO 路由 ============

// sitemap.xml 动态生成
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const posts = await query(`SELECT id, slug, updated_at FROM posts WHERE status = 'published' ORDER BY updated_at DESC LIMIT 1000`);
    const staticPages = [
      { path: '', priority: '1.0', freq: 'daily' },
      { path: '/forum', priority: '0.9', freq: 'daily' },
      { path: '/knowledge', priority: '0.8', freq: 'weekly' },
      { path: '/stories', priority: '0.8', freq: 'weekly' },
      { path: '/tools', priority: '0.7', freq: 'monthly' },
      { path: '/about', priority: '0.5', freq: 'monthly' },
      { path: '/contact', priority: '0.5', freq: 'monthly' },
      { path: '/privacy', priority: '0.3', freq: 'yearly' },
      { path: '/terms', priority: '0.3', freq: 'yearly' },
      { path: '/disclaimer', priority: '0.3', freq: 'yearly' },
      { path: '/cookie-policy', priority: '0.3', freq: 'yearly' },
    ];
    const today = new Date().toISOString().split('T')[0];
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${SITE_URL}${p.path || '/'}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.freq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });
    posts.forEach(p => {
      const postSlug = p.slug || p.id;
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today;
      xml += `  <url>\n    <loc>${SITE_URL}/post/${postSlug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });
    xml += '</urlset>';
    res.type('application/xml').send(xml);
  } catch (err) { next(err); }
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /login\nDisallow: /register\nDisallow: /search\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

// ============ 页面路由 ============

// 页面路由 - 传递基础数据给模板
router.get('/', async (req, res, next) => {
  try {
    const postsWithImages = 'SELECT p.*, u.username, u.avatar, (SELECT GROUP_CONCAT(pm.media_url ORDER BY pm.sort_order) FROM post_media pm WHERE pm.post_id = p.id AND pm.media_type = \'image\') AS images FROM posts p JOIN users u ON p.user_id = u.id';
    const [hotPosts, latestPosts, forumPosts, banners, stats] = await Promise.all([
      query(`${postsWithImages} WHERE p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL) ORDER BY p.view_count DESC, p.like_count DESC LIMIT 6`),
      query(`${postsWithImages} WHERE p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL) ORDER BY p.created_at DESC LIMIT 8`),
      query(`${postsWithImages} WHERE p.status = 'published' AND (p.review_status = 'approved' OR p.review_status IS NULL) AND p.post_type = 'forum' ORDER BY p.created_at DESC LIMIT 5`),
      query(`SELECT * FROM banners WHERE status = 1 ORDER BY sort_order ASC, id ASC LIMIT 5`),
      queryOne(`SELECT (SELECT COUNT(*) FROM posts WHERE status = 'published' AND DATE(created_at) = CURDATE()) as new_posts_today, (SELECT COUNT(*) FROM posts WHERE status = 'published' AND category IN ('cat-disease','dog-disease','medical-help') AND comment_count = 0) as pending_medical`),
    ]);
    res.render('index', { isHome: true, title: '毛茸茸星球-专业铲屎官宠物交流论坛 | 养猫养狗饲养问诊同城领养', metaDesc: '毛茸茸星球是铲屎官专属宠物社区，分享猫狗饲养干货、宠物疾病问诊、同城遛宠、无偿领养、宠物用品闲置交流，百万养宠经验免费查阅，一站式解决养宠难题。', metaKeywords: '宠物论坛,养猫攻略,养狗教程,猫咪疾病,同城宠物领养,宠物交流社区', hotPosts, latestPosts, forumPosts, banners, stats });
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

router.get('/forum', (req, res) => res.render('forum', { title: '宠物论坛 - 毛茸茸星球', metaDesc: '毛茸茸星球宠物论坛，涵盖猫咪饲养经验、宠物疾病问诊、同城宠物领养、宠物用品测评等热门话题，百万铲屎官在线交流养宠心得。' }));
router.get('/knowledge', (req, res) => res.render('knowledge', { title: '养宠百科 - 毛茸茸星球', metaDesc: '养宠百科知识库，涵盖猫、狗、兔、仓鼠、鸟类等宠物养护知识' }));
router.get('/stories', (req, res) => res.render('stories', { title: '萌宠故事 - 毛茸茸星球', metaDesc: '分享你与毛孩子的温馨故事，记录养宠生活中的点点滴滴' }));
router.get('/tools', (req, res) => res.render('tools', { title: '养宠工具箱 - 毛茸茸星球', metaDesc: '宠物年龄计算、喂食量计算、BMI健康评估、驱虫提醒等实用养宠工具' }));
router.get('/login', (req, res) => res.render('login', { title: '登录 - 毛茸茸星球', metaDesc: '登录毛茸茸星球，加入铲屎官社区' }));
router.get('/register', (req, res) => res.render('register', { title: '注册 - 毛茸茸星球', metaDesc: '注册毛茸茸星球账号，开启你的养宠之旅' }));
router.get('/msgboard', (req, res) => res.render('msgboard', { title: '留言板 - 毛茸茸星球', metaDesc: '毛茸茸星球留言板，留下你对宠物社区的建议和反馈' }));
router.get('/about', (req, res) => res.render('about', { title: '关于我们 - 毛茸茸星球', metaDesc: '了解毛茸茸星球——专为铲屎官打造的宠物社区平台' }));
router.get('/contact', (req, res) => res.render('contact', { title: '联系我们 - 毛茸茸星球', metaDesc: '联系毛茸茸星球团队，合作咨询与问题反馈' }));
router.get('/privacy', (req, res) => res.render('privacy', { title: '隐私政策 - 毛茸茸星球', metaDesc: '毛茸茸星球隐私政策，说明我们如何收集、使用和保护您的个人信息，包括Cookie使用和第三方广告披露。' }));
router.get('/disclaimer', (req, res) => res.render('disclaimer', { title: '免责声明 - 毛茸茸星球', metaDesc: '毛茸茸星球免责声明，说明网站内容的免责条款和责任限制。' }));
router.get('/terms', (req, res) => res.render('terms', { title: '使用条款 - 毛茸茸星球', metaDesc: '毛茸茸星球使用条款和服务协议，说明用户使用本网站需遵守的规则。' }));
router.get('/cookie-policy', (req, res) => res.render('cookie-policy', { title: 'Cookie政策 - 毛茸茸星球', metaDesc: '毛茸茸星球Cookie政策，说明网站Cookie的使用方式、类型及管理方法，包含Google AdSense广告Cookie披露。' }));
router.get('/search', (req, res) => res.render('search', { title: '搜索结果 - 毛茸茸星球', keyword: req.query.q || '', metaDesc: '搜索宠物相关内容 - 毛茸茸星球', metaRobots: 'noindex, follow' }));
router.get('/petprofile', (req, res) => res.render('petprofile', { title: '我的毛孩子 - 毛茸茸星球', metaDesc: '管理你的宠物档案，记录毛孩子的成长点滴' }));

// 帖子详情页（支持ID和slug）
router.get('/post/:id', async (req, res, next) => {
  try {
    const param = req.params.id;
    let post;
    if (/^\d+$/.test(param)) {
      post = await queryOne(
        `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
         FROM posts p JOIN users u ON p.user_id = u.id
         WHERE p.id = ? AND p.status = 'published'`, [param]
      );
    } else {
      post = await queryOne(
        `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
         FROM posts p JOIN users u ON p.user_id = u.id
         WHERE p.slug = ? AND p.status = 'published'`, [param]
      );
    }
    if (!post) return res.status(404).render('error', { title: '帖子未找到 - 毛茸茸星球', errorCode: 404, errorMessage: '帖子不存在或已被删除', errorDetail: '' });

    await query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [post.id]);
    post.view_count++;

    const media = await query('SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order', [post.id]);
    const comments = await query(
      `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'normal' AND c.parent_id IS NULL ORDER BY c.created_at ASC`, [post.id]
    );
    for (const comment of comments) {
      comment.replies = await query(
        `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.parent_id = ? AND c.status = 'normal' ORDER BY c.created_at ASC`, [comment.id]
      );
    }

    const relatedPosts = await query(
      `SELECT p.*, u.username, u.avatar FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.status = 'published' AND p.id != ? AND p.post_type = ? ORDER BY p.created_at DESC LIMIT 5`,
      [post.id, post.post_type]
    );

    // 为文章详情页生成 SEO 数据
    const excerpt = post.summary || (post.content || '').replace(/<[^>]*>/g, '').substring(0, 160);
    const coverImage = media.length > 0 ? (media[0].media_url.startsWith('http') ? media[0].media_url : `${SITE_URL}${media[0].media_url}`) : '';
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": excerpt,
      "author": { "@type": "Person", "name": post.username },
      "datePublished": post.created_at,
      "dateModified": post.updated_at || post.created_at,
      "image": coverImage ? coverImage : SITE_URL + '/images/og-default.jpg',
      "publisher": {
        "@type": "Organization",
        "name": "毛茸茸星球",
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": SITE_URL + '/favicon.png'
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${SITE_URL}/post/${post.slug || post.id}`
      }
    });

    const canonicalSlug = post.slug || post.id;
    res.render('post', {
      title: `${post.title} - 毛茸茸星球`,
      metaDesc: excerpt,
      metaKeywords: `宠物,${post.title.replace(/[<>'&]/g, '')},毛茸茸星球`,
      canonicalUrl: `${SITE_URL}/post/${canonicalSlug}`,
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
