require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// ========================
// 训练记录 API
// ========================

// 获取所有训练记录
app.get('/api/records', async (req, res) => {
  try {
    const { days = 30, action = '' } = req.query;
    
    let query = 'SELECT * FROM fitness_records WHERE 1=1';
    const params = [];
    
    if (days && days !== '0') {
      query += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(parseInt(days));
    }
    
    if (action) {
      query += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 1000';
    
    const connection = await pool.getConnection();
    const [records] = await connection.execute(query, params);
    connection.release();
    
    // 处理 JSON 字段
    const processedRecords = records.map(record => ({
      ...record,
      repsList: Array.isArray(record.reps_list)
        ? record.reps_list
        : (() => {
            try {
              return record.reps_list ? JSON.parse(record.reps_list) : [];
            } catch (e) {
              return [];
            }
          })(),
      weightsList: Array.isArray(record.weights_list)
        ? record.weights_list
        : (() => {
            try {
              return record.weights_list ? JSON.parse(record.weights_list) : [];
            } catch (e) {
              return [];
            }
          })()
    }));
    
    res.json(processedRecords);
  } catch (err) {
    console.error('获取记录错误:', err);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 获取所有动作列表
app.get('/api/actions', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT DISTINCT action FROM fitness_records ORDER BY action'
    );
    connection.release();
    
    const actions = rows.map(row => row.action);
    res.json(actions);
  } catch (err) {
    console.error('获取动作列表错误:', err);
    res.status(500).json({ error: '获取动作列表失败' });
  }
});

// 新增训练记录
app.post('/api/records', async (req, res) => {
  try {
    const { action, sets, reps, repsList, weight, weightsList } = req.body;

    // --- 新增：打印收到的数据，让你在终端能看到动作 ---
    console.log('------------------------------------');
    console.log('🔔 收到前端发送的健身记录:', action);
    console.log('📦 详细数据:', req.body);

    if (!action || !sets) {
      console.warn('⚠️ 插入失败：缺少必要字段');
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO fitness_records (action, sets, reps, reps_list, weight, weights_list)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        action,
        sets,
        reps || null,
        repsList ? JSON.stringify(repsList) : null,
        weight || null,
        weightsList ? JSON.stringify(weightsList) : null
      ]
    );
    connection.release();

    // --- 新增：打印成功存入数据库的提示 ---
    console.log('✅ 数据库写入成功，自动生成的ID为:', result.insertId);
    console.log('------------------------------------');

    res.status(201).json({
      id: result.insertId,
      action,
      sets,
      reps,
      repsList,
      weight,
      weightsList
    });
  } catch (err) {
    // 这里你本来就有 console.error，所以如果出错了，终端会跳出红字
    console.error('❌ 新增记录错误:', err);
    res.status(500).json({ error: '新增记录失败' });
  }
});

// 删除训练记录
app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'DELETE FROM fitness_records WHERE id = ?',
      [id]
    );
    connection.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('删除记录错误:', err);
    res.status(500).json({ error: '删除记录失败' });
  }
});

// 清空所有训练记录
app.delete('/api/records', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM fitness_records');
    connection.release();
    
    res.json({ success: true });
  } catch (err) {
    console.error('清空记录错误:', err);
    res.status(500).json({ error: '清空记录失败' });
  }
});

// ========================
// 统计数据 API
// ========================

// 获取所有训练记录
app.get('/api/records', async (req, res) => {
  try {
    const { days = 30, action = '' } = req.query;
    
    let query = 'SELECT * FROM fitness_records WHERE 1=1';
    const params = [];
    
    if (days && days !== '0') {
      query += ' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(parseInt(days));
    }
    
    if (action) {
      query += ' AND action LIKE ?';
      params.push(`%${action}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT 1000';
    
    const connection = await pool.getConnection();
    const [records] = await connection.execute(query, params);
    connection.release();
    
    // --- 核心修复：安全解析 JSON ---
    const processedRecords = records.map(record => {
      // 定义一个安全解析函数
      const safeParse = (data) => {
        // 如果驱动已经把它转成对象了，直接返回
        if (typeof data === 'object' && data !== null) {
          return data;
        }
        // 如果是字符串，才尝试解析
        try {
          return (typeof data === 'string' && data.trim()) ? JSON.parse(data) : [];
        } catch (e) {
          console.error("解析 JSON 失败，原始数据为:", data);
          return [];
        }
      };

      return {
        ...record,
        repsList: safeParse(record.reps_list),
        weightsList: safeParse(record.weights_list)
      };
    });
    
    res.json(processedRecords);
  } catch (err) {
    console.error('获取记录错误:', err);
    res.status(500).json({ error: '获取记录失败' });
  }
});

// 获取动作排名（按次数排序）
app.get('/api/rankings', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (days && days !== '0') {
      whereClause = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)';
      params.push(parseInt(days));
    }
    
    const connection = await pool.getConnection();
    const [rankings] = await connection.execute(
      `SELECT 
        action,
        COUNT(*) as count,
        COALESCE(SUM(sets), 0) as totalSets,
        COALESCE(SUM(reps), 0) as totalReps
       FROM fitness_records ${whereClause}
       GROUP BY action
       ORDER BY count DESC
       LIMIT 20`,
      params
    );
    connection.release();
    
    res.json(rankings);
  } catch (err) {
    console.error('获取排名错误:', err);
    res.status(500).json({ error: '获取排名失败' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n健身API服务器运行在 http://localhost:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`数据库: ${process.env.DB_NAME || 'fitness_record'}\n`);
});
