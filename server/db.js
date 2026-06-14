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

// TiDB / 云数据库需要 TLS 加密连接
if (process.env.DB_CA_CERT) {
  const caPath = path.resolve(__dirname, process.env.DB_CA_CERT);
  poolConfig.ssl = { ca: fs.readFileSync(caPath) };
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
