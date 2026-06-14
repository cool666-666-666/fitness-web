require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'fitness_record',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 非本地数据库自动启用 TLS（TiDB 等云数据库强制要求加密连接）
const isLocalDb = poolConfig.host === 'localhost' || poolConfig.host === '127.0.0.1';
if (!isLocalDb) {
  const caPath = path.resolve(__dirname, 'isrgrootx1.pem');
  if (fs.existsSync(caPath)) {
    poolConfig.ssl = { ca: fs.readFileSync(caPath) };
    console.log('✅ 已启用 TLS 加密连接');
  } else {
    console.warn('⚠️ 未找到 TLS 证书文件，尝试不加密连接（云数据库通常会拒绝）');
  }
}

const pool = mysql.createPool(poolConfig);

// 初始化数据库表
async function initDatabase() {
  const connection = await pool.getConnection();
  try {
    // 创建训练记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fitness_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        sets INT NOT NULL,
        reps INT,
        reps_list JSON,
        weight INT,
        weights_list JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_action_date (action, created_at),
        INDEX idx_created_at (created_at)
      )
    `);
    
    console.log('数据库表初始化成功');
  } catch (err) {
    if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
      console.error('数据库初始化错误:', err);
      throw err;
    }
  } finally {
    connection.release();
  }
}

// 初始化数据库
initDatabase().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});

module.exports = pool;
