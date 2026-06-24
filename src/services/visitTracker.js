const { query, queryOne } = require('../models');

/**
 * 初始化 site_visits 表
 */
async function ensureVisitTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS site_visits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visit_date DATE NOT NULL,
      visit_count INT NOT NULL DEFAULT 1,
      unique_visits INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_date (visit_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('[VISITS] site_visits 表已就绪');
}

/**
 * 记录一次页面访问（同一天同一IP只计一次UV，PV每次都计）
 * 使用 Redis 缓存当日UV去重，减少数据库压力
 */
async function recordVisit(req) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const redis = req.app.locals.redis;

    // PV: 每次都计
    // UV: 用Redis Set去重（当天+IP）
    let isNewVisit = true;
    if (redis && redis.isReady) {
      const redisKey = `visit:uv:${today}`;
      const added = await redis.sAdd(redisKey, [ip]);
      isNewVisit = added === 1; // sAdd返回1表示是新成员
    }

    // 用Redis计数器累计，定时同步到数据库
    if (redis && redis.isReady) {
      await redis.incr(`visit:pv:${today}`);
      // UV已经通过上面的sAdd去重了，不需要额外incr
    } else {
      // 无Redis时直接写数据库
      const existing = await queryOne(
        'SELECT id, visit_count, unique_visits FROM site_visits WHERE visit_date = ?',
        [today]
      );
      if (existing) {
        await query(
          'UPDATE site_visits SET visit_count = visit_count + 1, unique_visits = unique_visits + ? WHERE visit_date = ?',
          [isNewVisit ? 1 : 0, today]
        );
      } else {
        await query(
          'INSERT INTO site_visits (visit_date, visit_count, unique_visits) VALUES (?, 1, ?)',
          [today, isNewVisit ? 1 : 0]
        );
      }
    }
  } catch (err) {
    // 访问记录失败不应影响正常请求
    console.error('[VISITS] 记录失败:', err.message);
  }
}

/**
 * 将Redis中的访问计数同步到数据库（每小时执行一次）
 */
async function syncVisitStats(redis) {
  try {
    if (!redis || !redis.isReady) return;

    // 获取所有 pv: 和 uv: 开头的key
    const pvKeys = await redis.keys('visit:pv:*');
    const uvKeys = await redis.keys('visit:uv:*');

    for (const pvKey of pvKeys) {
      const dateStr = pvKey.replace('visit:pv:', '');
      const uvKey = `visit:uv:${dateStr}`;

      const pv = await redis.get(pvKey);
      // uv key 是 Set 类型，用 sCard 获取成员数
      let uv = 0;
      try { uv = await redis.sCard(uvKey); } catch(e) { uv = 0; }

      if (pv && parseInt(pv) > 0) {
        const existing = await queryOne(
          'SELECT id FROM site_visits WHERE visit_date = ?',
          [dateStr]
        );
        if (existing) {
          await query(
            'UPDATE site_visits SET visit_count = ?, unique_visits = ? WHERE visit_date = ?',
            [parseInt(pv), parseInt(uv), dateStr]
          );
        } else {
          await query(
            'INSERT INTO site_visits (visit_date, visit_count, unique_visits) VALUES (?, ?, ?)',
            [dateStr, parseInt(pv), parseInt(uv)]
          );
        }
        // 同步后删除Redis key，避免重复计数
        await redis.del(pvKey);
        await redis.del(uvKey);
      }
    }
    console.log('[VISITS] Redis访问数据已同步到数据库');
  } catch (err) {
    console.error('[VISITS] 同步失败:', err.message);
  }
}

/**
 * 获取访问统计
 */
async function getVisitStats(days = 30) {
  const totalResult = await queryOne(
    'SELECT COALESCE(SUM(visit_count), 0) as total_pv, COALESCE(SUM(unique_visits), 0) as total_uv FROM site_visits'
  );

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const startStr = startDate.getFullYear() + '-' + String(startDate.getMonth()+1).padStart(2,'0') + '-' + String(startDate.getDate()).padStart(2,'0');

  const dailyStats = await query(
    `SELECT visit_date, visit_count as pv, unique_visits as uv
     FROM site_visits
     WHERE visit_date >= ?
     ORDER BY visit_date ASC`,
    [startStr]
  );

  // 填充没有数据的日期为0
  const dailyMap = {};
  (dailyStats || []).forEach(row => {
    const d = new Date(row.visit_date);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    dailyMap[dateStr] = { pv: row.pv, uv: row.uv };
  });

  const trend = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - days + 1 + i);
    const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const data = dailyMap[dateStr] || { pv: 0, uv: 0 };
    trend.push({
      date: dateStr,
      pv: data.pv,
      uv: data.uv
    });
  }

  return {
    totalPv: totalResult?.total_pv || 0,
    totalUv: totalResult?.total_uv || 0,
    todayPv: dailyMap[todayStr]?.pv || 0,
    todayUv: dailyMap[todayStr]?.uv || 0,
    trend
  };
}

module.exports = { ensureVisitTable, recordVisit, syncVisitStats, getVisitStats };
