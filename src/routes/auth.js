const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../models');
const { auth, optionalAuth } = require('../middlewares/auth');
const { success, error, created } = require('../utils/response');
const config = require('../../config');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar = '🐱', petName, petType } = req.body;
    if (!username || !email || !password) return error(res, 400, '用户名、邮箱和密码不能为空');
    if (username.length < 2 || username.length > 20) return error(res, 400, '用户名长度2-20个字符');
    if (password.length < 6) return error(res, 400, '密码至少6个字符');

    const existing = await queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) return error(res, 409, '用户名或邮箱已存在');

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password_hash, avatar) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, avatar]
    );

    // 如果有宠物信息，创建宠物档案
    if (petName) {
      await query(
        'INSERT INTO pets (user_id, pet_name, pet_type) VALUES (?, ?, ?)',
        [result.insertId, petName, petType || 'other']
      );
    }

    const token = jwt.sign({ id: result.insertId, username, role: 'user' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const user = await queryOne('SELECT id, username, email, avatar, role, created_at FROM users WHERE id = ?', [result.insertId]);

    created(res, { token, user }, '注册成功');
  } catch (err) {
    return error(res, 500, '注册失败: ' + err.message);
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return error(res, 400, '用户名和密码不能为空');

    const user = await queryOne('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!user) return error(res, 401, '用户名或密码错误');
    if (user.status === 0) return error(res, 403, '账号已被禁用');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return error(res, 401, '用户名或密码错误');

    // 更新最后登录
    await query('UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [req.ip, user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const { password_hash, ...userInfo } = user;

    success(res, { token, user: userInfo }, '登录成功');
  } catch (err) {
    return error(res, 500, '登录失败: ' + err.message);
  }
});

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

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    if (!req.user) return error(res, 401, '请先登录');
    const user = await queryOne('SELECT id, username, email, avatar, avatar_url, role, last_login_at, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return error(res, 404, '用户不存在');

    const pets = await query('SELECT * FROM pets WHERE user_id = ? AND is_deleted = 0', [req.user.id]);
    success(res, { user, pets });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

module.exports = router;
