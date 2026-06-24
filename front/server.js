const config = require('../shared/config');
const { app } = require('./app');
const { initRedis } = require('./utils/redis');
const { ensureVisitTable, syncVisitStats } = require('../shared/services/visitTracker');
const { logInfo } = require('../shared/utils/logger');

const PORT = config.port;

async function start() {
  try {
    // 初始化 Redis
    await initRedis(app);

    // 初始化访问统计表
    await ensureVisitTable();

    // 定时同步访问统计到数据库
    setInterval(() => {
      const redis = app.locals.redis;
      if (redis) syncVisitStats(redis);
    }, 3600 * 1000);

    app.listen(PORT, () => {
      logInfo(`[FRONT] 前台服务启动成功，端口: ${PORT}`);
      console.log(`[FRONT] 前台地址: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[FRONT] 启动失败:', err);
    process.exit(1);
  }
}

start();
