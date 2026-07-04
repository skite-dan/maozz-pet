const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../../shared/models');
const { auth, optionalAuth } = require('../../shared/middlewares/auth');
const { success, error, created } = require('../../shared/utils/response');
const config = require('../../shared/config');

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar = '🐱', petName, petType, city } = req.body;
    if (!username || !email || !password) return error(res, 400, '用户名、邮箱和密码不能为空');
    if (username.length < 2 || username.length > 20) return error(res, 400, '用户名长度2-20个字符');
    if (password.length < 6) return error(res, 400, '密码至少6个字符');

    const existing = await queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) return error(res, 409, '用户名或邮箱已存在');

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, city, password_hash, avatar) VALUES (?, ?, ?, ?, ?)',
      [username, email, city || null, passwordHash, avatar]
    );

    if (petName) {
      await query(
        'INSERT INTO pets (user_id, pet_name, pet_type) VALUES (?, ?, ?)',
        [result.insertId, petName, petType || 'other']
      );
    }

    const token = jwt.sign({ id: result.insertId, username, role: 'user' }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const user = await queryOne('SELECT id, username, email, city, avatar, role, created_at FROM users WHERE id = ?', [result.insertId]);

    try {
      await query('UPDATE users SET points = points + 50 WHERE id = ?', [result.insertId]);
      await query('INSERT INTO user_points_log (user_id, action, points, balance, description) VALUES (?, ?, ?, ?, ?)', [result.insertId, 'register', 50, 50, '新用户注册奖励']);
      user.points = 50;
    } catch(e) { console.error('Points error:', e); }

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

    await query('UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?', [req.ip, user.id]);

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    const { password_hash, ...userInfo } = user;
    // Ensure city is included
    if (user.city) userInfo.city = user.city;

    try {
      const todayLogin = await queryOne('SELECT id FROM user_points_log WHERE user_id = ? AND action = ? AND DATE(created_at) = CURDATE() LIMIT 1', [user.id, 'daily_login']);
      if (!todayLogin) {
        await query('UPDATE users SET points = points + 5 WHERE id = ?', [user.id]);
        const newBalance = (userInfo.points || 0) + 5;
        await query('INSERT INTO user_points_log (user_id, action, points, balance, description) VALUES (?, ?, ?, ?, ?)', [user.id, 'daily_login', 5, newBalance, '每日登录奖励']);
        userInfo.points = newBalance;
      }
    } catch(e) { console.error('Login points error:', e); }

    success(res, { token, user: userInfo }, '登录成功');
  } catch (err) {
    return error(res, 500, '登录失败: ' + err.message);
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    if (!req.user) return error(res, 401, '请先登录');
    const user = await queryOne('SELECT id, username, email, city, avatar, avatar_url, role, last_login_at, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return error(res, 404, '用户不存在');

    const pets = await query('SELECT * FROM pets WHERE user_id = ? AND is_deleted = 0', [req.user.id]);
    let pointsLog = [];
    try {
      pointsLog = await query('SELECT * FROM user_points_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    } catch(e) {}
    success(res, { user, pets, pointsLog });
  } catch (err) {
    return error(res, 500, err.message);
  }
});

module.exports = router;
