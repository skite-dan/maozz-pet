const jwt = require('jsonwebtoken');
const config = require('../config');
const { queryOne } = require('../models');
const { unauthorized } = require('../utils/response');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) return unauthorized(res, '请先登录');
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (err) {
    return unauthorized(res, '登录已过期，请重新登录');
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (token) {
    try {
      req.user = jwt.verify(token, config.jwt.secret);
    } catch (err) { /* ignore */ }
  }
  next();
};

// 管理后台页面认证中间件（基于cookie）
const adminPageAuth = (req, res, next) => {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.redirect('/admin');
  }
  try {
    const decoded = jwt.verify(token, config.jwt.adminSecret);
    req.adminUser = decoded;
    res.locals.adminUser = decoded;
    next();
  } catch (err) {
    res.clearCookie('admin_token');
    return res.redirect('/admin');
  }
};

module.exports = { auth, optionalAuth, adminPageAuth };
