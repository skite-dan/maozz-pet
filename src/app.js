const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { logger, logError } = require('./utils/logger');

const app = express();

// 安全中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Cookie解析
app.use(cookieParser());

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
});
app.use('/api/', limiter);

// 更严格的登录限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { code: 429, message: '登录尝试次数过多，请15分钟后再试' },
});

// 日志
app.use(logger);

// 访问量统计中间件（排除API和管理后台请求）
const { recordVisit } = require('./services/visitTracker');
app.use((req, res, next) => {
  // 只统计页面访问，不统计API和静态资源
  if (!req.path.startsWith('/api/') &&
      !req.path.startsWith('/admin') &&
      !req.path.startsWith('/uploads') &&
      !req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    recordVisit(req);
  }
  next();
});

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// EJS模板引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// 全局变量
app.use((req, res, next) => {
  res.locals.siteName = '毛茸茸星球';
  res.locals.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
  res.locals.user = req.user || null;
  next();
});

// 路由
const routes = require('./routes');
app.use('/', routes);

// 404处理 - 区分API请求和页面请求
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ code: 404, message: '接口不存在' });
  }
  res.status(404).render('error', {
    title: '页面未找到 - 毛茸茸星球',
    errorCode: 404,
    errorMessage: '抱歉，您访问的页面不存在或已被移除',
    errorDetail: `路径: ${req.path}`
  });
});

// 全局错误处理 - 区分API请求和页面请求
app.use((err, req, res, next) => {
  logError(err, req);
  const statusCode = err.status || 500;
  if (req.path.startsWith('/api/') || req.xhr) {
    return res.status(statusCode).json({
      code: statusCode,
      message: statusCode === 429 ? err.message : '服务器内部错误',
    });
  }
  res.status(statusCode).render('error', {
    title: `${statusCode} - 毛茸茸星球`,
    errorCode: statusCode,
    errorMessage: statusCode === 404 ? '页面未找到' : '服务器开小差了，请稍后再试',
    errorDetail: process.env.NODE_ENV === 'development' ? err.message : ''
  });
});

module.exports = { app, authLimiter };
