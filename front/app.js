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

app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
}));

app.use(logger);

app.use((req, res, next) => {
  recordVisit(req);
  next();
});

app.use((req, res, next) => {
  res.locals.siteUrl = process.env.SITE_URL || 'https://www.maozz.online';
  res.locals.req = req;
  next();
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 86400000, etag: true }));
app.use(express.static(path.join(__dirname, '..', 'src', 'public'), { maxAge: 86400000, etag: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'src', 'public', 'uploads'), { maxAge: 86400000, etag: true }));
app.use(function(req, res, next) {
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400000');
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

const routes = require('./routes');
app.use('/', routes);

app.use((req, res) => {
  res.status(404).render('404', { title: '页面未找到 - 毛茸茸星球' });
});

app.use((err, req, res, next) => {
  console.error('[FRONT ERROR]', err);
  const statusCode = err.status || 500;
  res.status(statusCode).render('error', {
    title: statusCode + ' - 毛茸茸星球',
    errorCode: statusCode,
    errorMessage: statusCode === 404 ? '页面未找到' : '服务器开小差了，请稍后再试',
    errorDetail: config.nodeEnv === 'development' ? err.message : ''
  });
});

module.exports = { app };
