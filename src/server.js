const config = require('../config');
const { app } = require('./app');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('./models');

const PORT = config.port;

async function initAdmin() {
  try {
    const admin = await queryOne('SELECT id, password_hash FROM users WHERE username = ? AND role = ?', [config.admin.username, 'admin']);
    if (admin) {
      // 验证密码是否匹配，不匹配则更新
      const isMatch = await bcrypt.compare(config.admin.password, admin.password_hash);
      if (!isMatch) {
        const newHash = await bcrypt.hash(config.admin.password, 10);
        await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, admin.id]);
        console.log('[INIT] 管理员密码已更新');
      }
    } else {
      // 创建管理员
      const hash = await bcrypt.hash(config.admin.password, 10);
      await query(
        'INSERT INTO users (username, email, password_hash, avatar, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        [config.admin.username, 'admin@maozz.com', hash, '🛡️', 'admin', 1]
      );
      console.log('[INIT] 管理员账号已创建');
    }
  } catch (err) {
    console.error('[INIT] 管理员初始化失败:', err.message);
  }
}

async function initRedis() {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      socket: { host: config.redis.host, port: config.redis.port, reconnectStrategy: (retries) => Math.min(retries * 50, 500) },
      password: config.redis.password || undefined
    });
    client.on('error', (err) => {});
    client.on('connect', () => console.log('[REDIS] 连接成功'));
    await client.connect();
    // 挂载到全局
    app.locals.redis = client;
  } catch (err) {
    console.log('[REDIS] Redis未连接，缓存功能不可用');
  }
}

async function start() {
  await initAdmin();
  await initRedis();

  // 初始化访问量表
  const { ensureVisitTable, syncVisitStats } = require('./services/visitTracker');
  await ensureVisitTable();

  // 每小时同步Redis访问数据到数据库
  setInterval(() => {
    const redis = app.locals.redis;
    if (redis) syncVisitStats(redis);
  }, 3600 * 1000);

  app.listen(PORT, () => {
    console.log(`\n🐾 毛茸茸星球后端服务已启动`);
    console.log(`   地址: http://localhost:${PORT}`);
    console.log(`   环境: ${config.nodeEnv}`);
    console.log(`   数据库: ${config.db.host}:${config.db.port}/${config.db.database}`);
    console.log(`   Redis: ${config.redis.host}:${config.redis.port}`);
    console.log(`\n   管理后台: http://localhost:${PORT}/admin`);
    console.log(`   管理员账号: ${config.admin.username}`);
    console.log(`   管理员密码: ${config.admin.password}\n`);
  });
}

start().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
