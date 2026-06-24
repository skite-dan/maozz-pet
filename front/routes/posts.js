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

    let where = 'p.status = "published"';
    let params = [];

    if (type) { where += ' AND p.post_type = ?'; params.push(type); }
    if (category) { where += ' AND p.category = ?'; params.push(category); }
    if (keyword) { where += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

    let orderBy = 'p.created_at DESC';
    if (sort === 'hot') orderBy = 'p.view_count DESC, p.like_count DESC';
    if (sort === 'pinned') orderBy = 'p.is_pinned DESC, p.created_at DESC';

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

// 获取帖子详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await queryOne(
      `SELECT p.*, u.username, u.avatar, u.avatar_url as user_avatar_url
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.status = 'published'`,
      [req.params.id]
    );
    if (!post) return error(res, 404, '帖子不存在');

    await query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id]);
    post.view_count++;

    const media = await query('SELECT * FROM post_media WHERE post_id = ? ORDER BY sort_order', [req.params.id]);

    const comments = await query(
      `SELECT c.*, u.username, u.avatar
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'normal' AND c.parent_id IS NULL
       ORDER BY c.created_at ASC`,
      [req.params.id]
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

// 创建帖子
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, post_type = 'forum', category, tags } = req.body;
    if (!title || !content) return error(res, 400, '标题和内容不能为空');

    const result = await query(
      'INSERT INTO posts (user_id, title, content, post_type, category, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, content, post_type, category, tags]
    );

    if (req.body.media && req.body.media.length > 0) {
      for (let i = 0; i < req.body.media.length; i++) {
        const m = req.body.media[i];
        await query(
          'INSERT INTO post_media (post_id, media_type, media_url, thumbnail_url, file_size, mime_type, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [result.insertId, m.type, m.url, m.thumbnail || null, m.size || null, m.mime || null, i]
        );
      }
    }

    created(res, { postId: result.insertId }, '发帖成功');
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

module.exports = router;
