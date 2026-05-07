# 健身记录 API 服务器

Node.js + Express + MySQL 后端服务

## 安装与配置

### 1. 安装依赖
```bash
cd server
npm install
```

### 2. 配置数据库

编辑 `.env` 文件，配置 MySQL 连接参数：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=fitness_record
PORT=3000
```

### 3. 创建 MySQL 数据库

```sql
CREATE DATABASE fitness_record CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动服务器

**开发模式（使用 nodemon）：**
```bash
npm run dev
```

**生产模式：**
```bash
npm start
```

服务器将在 `http://localhost:3000` 上运行

## API 端点

### 训练记录

#### 获取所有记录
```
GET /api/records?days=30&action=卧推
```

#### 获取所有动作
```
GET /api/actions
```

#### 新增记录
```
POST /api/records
Content-Type: application/json

{
  "action": "卧推",
  "sets": 4,
  "reps": 10,
  "repsList": [12, 10, 8, 8],
  "weight": 65,
  "weightsList": [60, 65, 65, 70]
}
```

#### 删除记录
```
DELETE /api/records/:id
```

#### 清空所有记录
```
DELETE /api/records
```

### 统计数据

#### 获取统计信息
```
GET /api/stats?days=30
```

#### 获取动作排名
```
GET /api/rankings?days=30
```

#### 健康检查
```
GET /api/health
```

## 数据库表结构

```sql
CREATE TABLE fitness_records (
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
);
```
