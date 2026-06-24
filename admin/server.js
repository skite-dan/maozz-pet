const config = require('../shared/config');
const { app } = require('./app');
const { initRedis } = require('./utils/redis');
const { logInfo } = require('../shared/utils/logger');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../shared/models');

const PORT = config.adminPort;

// 初始化管理员账号
async function initAdmin() {
  try {
    const admin = await queryOne('SELECT * FROM users WHERE role = ?', ['admin']);
    if (!admin) {
      const hash = await bcrypt.hash(config.admin.password, 10);
      await query(
        'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
        [config.admin.username, 'admin@maozz.com', hash, 'admin', 1]
      );
      console.log(`[ADMIN] 管理员账号已创建: ${config.admin.username}`);
    } else {
      // 更新密码
      const hash = await bcrypt.hash(config.admin.password, 10);
      await query('UPDATE users SET password_hash = ? WHERE role = ?', [hash, 'admin']);
      console.log(`[ADMIN] 管理员密码已更新: ${config.admin.username}`);
    }
  } catch (err) {
    console.error('[ADMIN] 初始化管理员失败:', err.message);
  }
}

async function start() {
  try {
    // 初始化管理员
    await initAdmin();

    // 初始化 Redis
    await initRedis(app);

    app.listen(PORT, () => {
      logInfo(`[ADMIN] 后台管理服务启动成功，端口: ${PORT}`);
      console.log(`[ADMIN] 后台地址: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[ADMIN] 启动失败:', err);
    process.exit(1);
  }
}

start();
