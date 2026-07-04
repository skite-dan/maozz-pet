const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('../shared/config');
const { logger } = require('../shared/utils/logger');
const { recordVisit } = require('../shared/services/visitTracker');

const app = express();

// 安全中间件
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - 允许前端跨域访问
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 限流
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 前台可以稍微放宽
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
}));

// 日志
app.use(logger);

// 访问记录
app.use((req, res, next) => {
  recordVisit(req);
  next();
});

// SEO 全局变量
app.use((req, res, next) => {
  res.locals.siteUrl = process.env.SITE_URL || 'https://www.maozz.online';
  res.locals.req = req;
  next();
});

// 静态资源
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '..', 'src', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'src', 'public', 'uploads')));

// 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// 路由
const routes = require('./routes');
app.use('/', routes);

// 404
app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到 - 毛茸茸星球' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[FRONT ERROR]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).render('error', {
    title: `${statusCode} - 毛茸茸星球`,
    errorCode: statusCode,
    errorMessage: statusCode === 404 ? '页面未找到' : '服务器开小差了，请稍后再试',
    errorDetail: config.nodeEnv === 'development' ? err.message : ''
  });
});

module.exports = { app };
