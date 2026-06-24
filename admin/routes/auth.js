const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../shared/models');
const { success, error } = require('../../shared/utils/response');
const config = require('../../shared/config');

const router = express.Router();

// 管理员登录
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 400, '用户名和密码不能为空');

    const user = await queryOne('SELECT * FROM users WHERE username = ? AND role = ?', [username, 'admin']);
    if (!user) return error(res, 401, '管理员账号或密码错误');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return error(res, 401, '管理员账号或密码错误');

    await query('UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [req.ip, user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, role: 'admin' }, config.jwt.adminSecret, { expiresIn: '24h' });
    const { password_hash, ...userInfo } = user;

    // 设置cookie供后台页面使用
    res.cookie('admin_token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      sameSite: 'lax'
    });

    success(res, { token, user: userInfo }, '管理员登录成功');
  } catch (err) {
    return error(res, 500, '管理员登录失败: ' + err.message);
  }
});

// 管理员退出登录
router.post('/admin-logout', (req, res) => {
  res.clearCookie('admin_token');
  success(res, null, '退出成功');
});

module.exports = router;
