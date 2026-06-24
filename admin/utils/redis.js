const { createClient } = require('redis');
const config = require('../../shared/config');

async function initRedis(app) {
  try {
    const redis = createClient({
      socket: { host: config.redis.host, port: config.redis.port },
      password: config.redis.password || undefined,
    });

    redis.on('error', (err) => {
      console.error('[REDIS] Redis Client Error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[REDIS] Redis 连接成功');
      redis.isReady = true;
    });

    redis.on('end', () => {
      console.log('[REDIS] Redis 连接断开');
      redis.isReady = false;
    });

    await redis.connect();
    app.locals.redis = redis;
  } catch (err) {
    console.error('[REDIS] Redis 初始化失败:', err.message);
    console.log('[REDIS] 继续运行，但不使用 Redis 缓存');
    app.locals.redis = null;
  }
}

module.exports = { initRedis };
