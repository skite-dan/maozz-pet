const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('../shared/config');
const { logger } = require('../shared/utils/logger');

const app = express();

// 安全中间件
app.use(helmet({ contentSecurityPolicy: false }));

// CORS - 允许前台跨域访问管理API
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 限流 - 后台更严格
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
}));

// 日志
app.use(logger);

// 静态资源 - 上传文件访问
app.use('/uploads', express.static(path.join(__dirname, '..', 'src', 'public', 'uploads')));

// 视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// 上传路由
const uploadRoutes = require('../front/routes/upload');
app.use('/api/upload', uploadRoutes);

// 路由
const routes = require('./routes');
app.use('/', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('[ADMIN ERROR]', err);
  res.status(500).json({
    code: 500,
    message: config.nodeEnv === 'development' ? err.message : '服务器内部错误',
    data: config.nodeEnv === 'development' ? err.stack : null
  });
});

module.exports = { app };
