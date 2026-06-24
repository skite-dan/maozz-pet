const express = require('express');
const { query } = require('../models');
const { auth } = require('../middlewares/auth');
const { success, error, created } = require('../utils/response');

const router = express.Router();

// 获取评论
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await query(
      `SELECT c.*, u.username, u.avatar FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ? AND c.status = 'normal' AND c.parent_id IS NULL
       ORDER BY c.created_at DESC LIMIT 50`,
      [req.params.postId]
    );
    for (const c of comments) {
      c.replies = await query(
        `SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id = u.id WHERE c.parent_id = ? AND c.status = 'normal' ORDER BY c.created_at`,
        [c.id]
      );
    }
    success(res, comments);
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 创建评论
router.post('/', auth, async (req, res) => {
  try {
    const { post_id, content, parent_id } = req.body;
    if (!post_id || !content) return error(res, 400, '帖子ID和评论内容不能为空');

    await query(
      'INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [post_id, req.user.id, parent_id || null, content]
    );
    await query('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?', [post_id]);

    created(res, null, '评论成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

module.exports = router;
