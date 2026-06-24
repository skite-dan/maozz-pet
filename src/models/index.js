const mysql = require('mysql2/promise');
const config = require('../../config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  connectionLimit: config.db.connectionLimit,
  charset: 'utf8mb4',
  timezone: '+08:00',
  waitForConnections: true,
  queueLimit: 0,
});

pool.on('connection', (conn) => {
  console.log(`[DB] MySQL connection established (threadId: ${conn.threadId})`);
});

pool.on('error', (err) => {
  console.error('[DB] MySQL pool error:', err.message);
});

// 使用 query 方法（支持字符串拼接SQL + 参数化占位符混合使用）
const query = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

const queryOne = async (sql, params = []) => {
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

const execute = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const beginTransaction = async () => {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  return {
    conn,
    query: (sql, params) => conn.query(sql, params),
    execute: (sql, params) => conn.execute(sql, params),
    commit: () => conn.commit(),
    rollback: () => conn.rollback(),
    release: () => conn.release(),
  };
};

module.exports = { pool, query, queryOne, execute, beginTransaction };
