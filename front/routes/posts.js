const express = require('express');
const { query, queryOne } = require('../../shared/models');
const { auth, optionalAuth } = require('../../shared/middlewares/auth');
const { success, error, created } = require('../../shared/utils/response');

const router = express.Router();

// 获取帖子列表
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, sort = 'latest', keyword } = req.query;
    const offset = (page - 1) * limit;

    let where = 'p.status = "published" AND (p.review_status = "approved" OR p.review_status IS NULL)';
    let params = [];

    if (type) { where += ' AND p.post_type = ?'; params.push(type); }
    if (category) { where += ' AND p.category = ?'; params.push(category); }
    if (keyword) { where += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

    let orderBy = 'p.created_at DESC';
    if (sort === 'hot') orderBy = 'p.view_count DESC, p.like_count DESC';
    if (sort === 'pinned') orderBy = 'p.is_pinned DESC, p.created_at DESC';
    if (sort === 'likes') orderBy = 'p.like_count DESC, p.created_at DESC';
    if (sort === 'comments') orderBy = 'p.comment_count DESC, p.created_at DESC';
    if (sort === 'weekly_views') orderBy = 'p.weekly_views DESC, p.created_at DESC';
    if (sort === 'city_latest') { orderBy = 'p.created_at DESC'; if (req.query.city) { where += ' AND p.city = ?'; params.push(req.query.city); } }

    const posts = await query(
      `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url,
       (SELECT GROUP_CONCAT(pm.media_url ORDER BY pm.sort_order) FROM post_media pm WHERE pm.post_id = p.id AND pm.media_type = 'image') AS images
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const totalResult = await queryOne(`SELECT COUNT(*) as total FROM posts p WHERE ${where}`, params);

    success(res, { posts, total: totalResult?.total || 0, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 生成slug
function generateSlug(title) {
  const slug = title.trim().replace(/[<>:"/\\|?*#&%=+\s]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80) || 'post';
  return slug;
}

// 获取帖子详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const param = req.params.id;
    let post;
    // Increment weekly_views
    if (/^\d+$/.test(param)) {
      await query('UPDATE posts SET view_count = view_count + 1, weekly_views = weekly_views + 1 WHERE id = ?', [param]);
    } else {
      await query('UPDATE posts SET view_count = view_count + 1, weekly_views = weekly_views + 1 WHERE slug = ?', [param]);
    }
    if (/^\d+$/.test(param)) {
      post = await queryOne(
        `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
         FROM posts p JOIN users u ON p.user_id = u.id
         WHERE p.id = ? AND p.status = 'published'`,
        [param]
      );
    } else {
      post = await queryOne(
        `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
         FROM posts p JOIN users u ON p.user_id = u.id
         WHERE p.slug = ? AND p.status = 'published'`,
        [param]
      );
    }
    if (!post) return error(res, 404, '帖子不存在');

    post.view_count++;

    const media = await query('SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order', [post.id]);

    const comments = await query(
      `SELECT c.*, u.username, u.avatar
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'normal' AND c.parent_id IS NULL
       ORDER BY c.created_at ASC`,
      [post.id]
    );

    for (const comment of comments) {
      comment.replies = await query(
        `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.parent_id = ? AND c.status = 'normal' ORDER BY c.created_at ASC`,
        [comment.id]
      );
    }

    success(res, { post, media, comments });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 敏感词检测
const SENSITIVE_WORDS = ['赌博', '色情', '淫秽', '毒品', '诈骗', '传销', '洗钱', '假证', '代孕', '卖肾', '枪支', '弹药', '翻墙', 'VPN', '政治', '反党', '反动', '颠覆', '暴乱', '台独', '藏独', '疆独', '法轮功', '邪教', '代开发票', '发票代开', '假币', '高仿', 'A货', '假货', '走私', '偷税', '漏税', '非法集资', '高回报', '稳赚', '包赚', '内幕消息', '涨停', '配资', '杠杆', '放贷', '高利贷', '裸贷', '校园贷', '套路贷', '加微信', '加QQ', '微信号', 'QQ号', '联系方式', '私信我', '联系我', '+V', '+q', '微信', '微商', '代理', '加盟', '招商', '投资', '理财', '保本', '高收益', '日赚', '月入', '年薪', '招聘', '兼职', '刷单', '刷信誉', '刷销量', '好评返现', '返利', '优惠券', '免费送', '0元购', '一元购', '秒杀', '限时抢购'];
function checkSensitiveWords(text) {
  if (!text) return [];
  const found = [];
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) found.push(word);
  }
  return found;
}

// 创建帖子
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, post_type = 'forum', category, tags, city, post_template } = req.body;
    if (!title || !content) return error(res, 400, '标题和内容不能为空');

    // 1. 敏感词检测
    const sensitiveFound = checkSensitiveWords(title + content);
    let reviewStatus = 'approved';
    let reviewReason = null;

    if (sensitiveFound.length > 0) {
      reviewStatus = 'pending';
      reviewReason = '触发敏感词: ' + sensitiveFound.join(', ');
    } else {
      // 2. 分类审核 + 信用分级
      const reviewCategories = ['secondhand', 'pet-transfer', 'service', 'city-adoption', 'city-breed'];
      if (reviewCategories.includes(category)) {
        // 检查用户信用：发帖10篇以上且无违规记录可免审
        const userPostCount = await queryOne('SELECT COUNT(*) as cnt FROM posts WHERE user_id = ? AND status = "published"', [req.user.id]);
        const userViolationCount = await queryOne('SELECT COUNT(*) as cnt FROM user_violations WHERE user_id = ?', [req.user.id]);
        if (userPostCount.cnt < 10 || userViolationCount.cnt > 0) {
          reviewStatus = 'pending';
          reviewReason = '交易类帖子需审核';
        }
      }
    }

    const slug = generateSlug(title);
    const slugCheck = await queryOne('SELECT id FROM posts WHERE slug = ?', [slug]);
    const finalSlug = slugCheck ? slug + '-' + Date.now().toString(36) : slug;
    const result = await query(
      'INSERT INTO posts (user_id, title, content, post_type, category, tags, city, post_template, review_status, review_reason, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, content, post_type, category, tags, city, post_template, reviewStatus, reviewReason, finalSlug]
    );

    try {
      await query('UPDATE users SET points = points + 20 WHERE id = ?', [req.user.id]);
      const userInfo = await queryOne('SELECT points FROM users WHERE id = ?', [req.user.id]);
      await query('INSERT INTO user_points_log (user_id, action, points, balance, description) VALUES (?, ?, ?, ?, ?)', [req.user.id, 'create_post', 20, userInfo.points, '发布帖子奖励']);
    } catch(e) { console.error('Post points error:', e); }

    if (req.body.media && req.body.media.length > 0) {
      for (let i = 0; i < req.body.media.length; i++) {
        const m = req.body.media[i];
        await query(
          'INSERT INTO post_media (post_id, media_type, media_url, thumbnail_url, file_size, mime_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, m.type, m.url, m.thumbnail || null, m.size || null, m.mime || null, i]
        );
      }
    }

    let msg = '发帖成功';
    if (reviewStatus === 'pending') {
      msg = '帖子已提交，预计2小时内审核完成，审核通过后将自动展示';
    }
    created(res, { postId: result.insertId, reviewStatus, reviewReason }, msg);
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 点赞/取消点赞
router.post('/:id/like', auth, async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (existing) {
      await query('DELETE FROM post_likes WHERE id = ?', [existing.id]);
      await query('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [req.params.id]);
      success(res, { liked: false }, '取消点赞');
    } else {
      await query('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
      await query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [req.params.id]);
      success(res, { liked: true }, '点赞成功');
    }
  } catch (err) {
    return error(res, 500, err.message);
  }
});



// 举报帖子
router.post('/:id/report', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { reason, detail } = req.body;
    if (!reason) return error(res, 400, '请选择举报原因');

    const post = await queryOne('SELECT id, user_id, status, review_status FROM posts WHERE id = ?', [postId]);
    if (!post) return error(res, 404, '帖子不存在');

    // 插入举报记录
    await query(
      'INSERT INTO reports (post_id, reporter_id, reason, detail, status) VALUES (?, ?, ?, ?, ?)',
      [postId, req.user.id, reason, detail || null, 'pending']
    );

    // 如果举报数达到3次，自动下架帖子
    const reportCount = await queryOne('SELECT COUNT(*) as cnt FROM reports WHERE post_id = ? AND status = "pending"', [postId]);
    if (reportCount.cnt >= 3) {
      await query('UPDATE posts SET status = "hidden", review_status = "pending" WHERE id = ?', [postId]);
      await query('INSERT INTO user_violations (user_id, post_id, type, detail) VALUES (?, ?, ?, ?)', [post.user_id, postId, 'abuse', '被多次举报，帖子已下架']);
    }

    success(res, null, '举报成功，我们会尽快处理');
  } catch (err) {
    return error(res, 500, err.message);
  }
});
module.exports = router;
