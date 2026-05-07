# 健身记录网站 - 数据库集成完整指南

## 📋 项目结构

```
fitness-record/
├── fitness-web-main/               # 前端应用
│   ├── index.html                 # HTML 页面
│   ├── app.js                      # 前端应用代码（已升级为支持API）
│   └── style.css                   # 样式文件
│
└── server/                          # Node.js 后端服务
    ├── server.js                   # Express 应用主文件
    ├── db.js                       # MySQL 数据库连接和初始化
    ├── package.json                # Node.js 依赖配置
    ├── .env                        # 环境变量配置
    └── README.md                   # 后端详细文档
```

## 🚀 快速开始

### 第一步：安装 Node.js 和 MySQL

**Windows:**
- 下载 Node.js: https://nodejs.org/ (LTS 版本)
- 下载 MySQL: https://dev.mysql.com/downloads/mysql/ 或使用 XAMPP/WAMP

**Mac:**
```bash
brew install node mysql
```

**Linux (Ubuntu):**
```bash
sudo apt-get install nodejs npm mysql-server
```

### 第二步：创建 MySQL 数据库

打开 MySQL 命令行或 MySQL Workbench，执行：

```sql
CREATE DATABASE fitness_record CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 第三步：配置后端环境变量

编辑 `server/.env` 文件，根据你的 MySQL 配置修改：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root                    # 你的 MySQL 用户名
DB_PASSWORD=password            # 你的 MySQL 密码
DB_NAME=fitness_record
PORT=3000
NODE_ENV=development
```

### 第四步：安装后端依赖并启动服务器

```bash
# 进入 server 目录
cd server

# 安装依赖
npm install

# 启动服务器
npm start
```

你应该看到：
```
✓ 数据库表初始化成功
健身API服务器运行在 http://localhost:3000
```

### 第五步：打开前端应用

在浏览器中打开 `fitness-web-main/index.html`，你会看到顶部的数据库连接状态指示器为绿色 (✓ 已连接到数据库)。

## 🔧 开发工作流

### 使用 nodemon 自动重启服务器

安装 nodemon（自动重启工具）：

```bash
npm install -g nodemon
# 或在项目中安装
npm install --save-dev nodemon
```

然后使用开发模式启动：

```bash
npm run dev
```

这样修改 `server.js` 后会自动重启服务器。

### 测试 API 端点

使用 Postman、VS Code REST Client 或 curl 测试：

```bash
# 获取所有记录
curl http://localhost:3000/api/records

# 新增记录
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -d '{
    "action": "卧推",
    "sets": 4,
    "repsList": [12, 10, 8, 8],
    "weightsList": [60, 65, 65, 70]
  }'

# 获取统计数据
curl http://localhost:3000/api/stats

# 健康检查
curl http://localhost:3000/api/health
```

## 🔌 API 端点详细文档

see [server/README.md](server/README.md)

## 📊 数据流

```
┌─────────────────────┐
│   前端 (HTML/JS)    │
│  - index.html       │
│  - app.js (已升级)  │
└──────────┬──────────┘
           │ API 请求 (HTTP)
           ↓
┌─────────────────────┐
│  后端 (Express)     │
│  - server.js        │
│  - 路由处理         │
└──────────┬──────────┘
           │ SQL 查询
           ↓
┌─────────────────────┐
│  MySQL 数据库       │
│  - fitness_records  │
│  - 表结构已创建     │
└─────────────────────┘

备份：
├→ localStorage (浏览器本地存储)
```

## 🔄 数据同步机制

### 在线模式（数据库已连接）
- ✓ 数据自动保存到 MySQL 数据库
- ✓ 从数据库加载记录
- ✓ 本地 localStorage 作为备份

### 离线模式（数据库未连接）
- ⚠️ 使用本地 localStorage 存储数据
- ⚠️ 页面显示黄色警告提示
- ✓ 数据库连接恢复后自动同步

## 🆘 常见问题

### Q: "连接中..." 一直显示，网页不加载数据？
**A:** 检查以下几点：
1. 后端服务是否启动（运行 `npm start`）
2. MySQL 服务是否运行
3. `.env` 中的数据库配置是否正确
4. 查看浏览器控制台（F12）看是否有错误信息

### Q: 前端页面无法连接服务器怎么办？
**A:** 
1. 确保后端已启动在 `http://localhost:3000`
2. 检查浏览器控制台错误
3. 确认 MySQL 和 Node.js 服务都已启动

### Q: 删除或清空记录后进度条仍然显示如何处理？
**A:** 这是由于页面缓存，刷新即可。

### Q: 如何修改 API 地址（如部署到远程服务器）？
**A:** 编辑 `fitness-web-main/app.js` 中的：
```javascript
const API_BASE_URL = "http://localhost:3000/api";
```
改为你的服务器地址：
```javascript
const API_BASE_URL = "http://your-server.com:3000/api";
```

## 🌐 部署到生产环境

### 部署后端到云服务（以 Heroku 为例）

```bash
# 1. 安装 Heroku CLI
# 2. 登录 Heroku
heroku login

# 3. 创建应用
heroku create your-app-name

# 4. 添加 MySQL 数据库（使用 ClearDB）
heroku addons:create cleardb:ignite

# 5. 获取数据库 URL
heroku config:get CLEARDB_DATABASE_URL

# 6. 部署
git push heroku main
```

### 部署前端到 GitHub Pages 或 Vercel

1. 将 `fitness-web-main` 目录上传到 GitHub
2. 使用 Vercel/Netlify 进行自动部署
3. 修改前端中的 `API_BASE_URL` 指向你的生产服务器

## 📝 后续改进建议

- [ ] 添加用户认证系统
- [ ] 实现数据导出 (Excel/CSV)
- [ ] 添加训练计划功能
- [ ] 实现数据图表展示
- [ ] 添加移动应用版本
- [ ] 实现云备份功能

## 📞 支持

如遇到问题，检查：
1. 浏览器控制台 (F12 > Console)
2. 服务器日志输出
3. MySQL 错误日志

---

**版本:** 1.0.0  
**最后更新:** 2026年4月
