const express = require('express');
const { query, queryOne } = require('../../shared/models');
const { auth, optionalAuth } = require('../../shared/middlewares/auth');
const { success, error, created } = require('../../shared/utils/response');

const router = express.Router();

// 获取留言列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const messages = await query(
      `SELECT m.*, u.username, u.avatar FROM messages m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.status = 'normal'
       ORDER BY m.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );
    const totalResult = await queryOne('SELECT COUNT(*) as total FROM messages WHERE status = "normal"');
    success(res, { messages, total: totalResult?.total || 0 });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

// 创建留言
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { content, nickname } = req.body;
    if (!content) return error(res, 400, '留言内容不能为空');

    await query(
      'INSERT INTO messages (user_id, nickname, content, ip) VALUES (?, ?, ?, ?)',
      [req.user?.id || null, nickname || '游客', content, req.ip]
    );
    created(res, null, '留言成功');
  } catch (err) {
    return error(res, 500, err.message);
  }
});

module.exports = router;
