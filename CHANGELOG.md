# 数据库集成 - 变更记录

## 📅 日期
2026年4月28日

## 📦 新增功能

### 后端服务 (Node.js + Express + MySQL)

**创建文件：**
- `server/server.js` - Express API 服务器，包含以下端点：
  - `GET /api/records` - 获取训练记录
  - `GET /api/actions` - 获取所有动作名称
  - `POST /api/records` - 新增训练记录
  - `DELETE /api/records/:id` - 删除特定记录
  - `DELETE /api/records` - 清空所有记录
  - `GET /api/stats` - 获取统计数据
  - `GET /api/rankings` - 获取动作排名
  - `GET /api/health` - 健康检查

- `server/db.js` - MySQL 数据库连接和初始化
  - 自动创建 `fitness_records` 表
  - 支持连接池
  - 索引优化

- `server/package.json` - Node.js 依赖管理
  - Express 4.18.2
  - mysql2 3.6.0
  - CORS 支持
  - dotenv 环境变量

- `server/.env` - 环境变量配置文件
  - 数据库连接参数
  - 服务器端口设置

- `server/README.md` - 后端详细文档

### 前端升级

**修改文件：**
- `fitness-web-main/app.js` - 完整重构以支持 API：
  - 新增 `API_BASE_URL` 配置
  - 新增 `apiCall()` 函数处理 HTTP 请求
  - 新增 `initDatabase()` 初始化数据库连接
  - 修改 `loadRecords()` 支持从 API 加载数据
  - 修改 `addRecord()` 异步调用 API 保存记录
  - 修改 `removeRecord()` 异步删除操作
  - 修改 `clearAll()` 异步清空操作
  - 新增 `updateDbStatus()` 更新连接状态显示
  - 优雅降级：当数据库不可用时自动使用 localStorage

- `fitness-web-main/index.html` - 新增数据库状态指示器：
  - 添加 `#dbStatus` 元素显示连接状态
  - 实时反映 "已连接" 或 "本地存储" 状态

### 文档

**创建文件：**
- `README.md` - 完整项目指南
  - 项目结构说明
  - 快速开始步骤
  - API 文档链接
  - 数据流说明
  - 数据同步机制
  - 常见问题解答
  - 部署指南

- `QUICK_START.md` - 30秒快速启动指南
  - 最小化配置步骤
  - 验证设置成功的方法
  - 快速排查表格

## 🔄 数据同步策略

### 在线模式
1. 新增记录时：自动保存到 MySQL + localStorage
2. 删除记录时：自动从 MySQL + localStorage 删除
3. 清空记录时：自动从 MySQL + localStorage 清空

### 离线模式（数据库未连接）
1. 所有操作使用 localStorage
2. 页面显示黄色警告提示
3. 保留所有 localStorage 数据做备份

## 🗄️ 数据库架构

### fitness_records 表
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

**字段说明：**
- `id` - 主键，自动递增
- `action` - 训练动作名称
- `sets` - 组数
- `reps` - 单组次数（如果所有组都相同）
- `reps_list` - JSON 数组，每组的次数
- `weight` - 单组重量（如果所有组都相同）
- `weights_list` - JSON 数组，每组的重量
- `created_at` - 创建时间戳
- `updated_at` - 更新时间戳
- 索引用于加速查询

## ⚙️ 系统要求

- Node.js 14.0+
- MySQL 5.7+ 或 8.0+
- 现代浏览器 (支持 Fetch API)

## 🔐 安全性考虑

当前版本为开发版本，下一版本应添加：
- [ ] API 认证 (JWT)
- [ ] CORS 策略
- [ ] 输入验证和清理
- [ ] SQL 注入防护
- [ ] 速率限制

## 🚀 部署检查清单

- [ ] MySQL 数据库已创建
- [ ] `.env` 配置正确
- [ ] 依赖已安装 (`npm install`)
- [ ] 后端可正常启动 (`npm start`)
- [ ] 前端可以连接 API
- [ ] localStorage 备份功能正常
- [ ] 所有 CRUD 操作正常

## 📈 向后兼容性

✓ 完全兼容旧的 localStorage 数据
✓ 自动迁移现有的本地数据
✓ 允许离线使用

## 🔄 版本历史

- **v1.0.0** (2026-04-28) - 初始版本：Node.js + MySQL 集成
- **v0.1.0** (之前) - 纯 localStorage 版本

---

**下一步计划：**
1. 添加用户认证
2. 实现数据导出功能
3. 添加图表展示
4. 优化性能
5. 部署到云服务
