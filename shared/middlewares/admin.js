const jwt = require('jsonwebtoken');
const config = require('../config');
const { forbidden } = require('../utils/response');

const admin = (req, res, next) => {
  // 优先检查admin_token cookie，其次检查Authorization header
  const token = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '请先登录管理后台' });
  }
  try {
    const decoded = jwt.verify(token, config.jwt.adminSecret);
    if (decoded.role !== 'admin') {
      return forbidden(res, '需要管理员权限');
    }
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ code: 401, message: '管理员登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, message: '管理员登录已过期，请重新登录' });
  }
};

module.exports = { admin };
