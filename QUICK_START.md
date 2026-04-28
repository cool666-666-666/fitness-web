# 快速启动指南 (30 秒钟设置)

## ⚡ 最快设置方式

### 步骤 1: 确保 MySQL 正在运行
```bash
# Windows (XAMPP/WAMP) 中启动 MySQL
# 或命令行：
mysql -u root -p
# 创建数据库
CREATE DATABASE fitness_record CHARACTER SET utf8mb4;
EXIT;
```

### 步骤 2: 配置后端
```bash
cd server
npm install
```

编辑 `server/.env` 文件，确保数据库配置正确。

### 步骤 3: 启动服务器
```bash
# 在 server 目录中
npm start
```

你会看到：
```
✓ 数据库表初始化成功
健身API服务器运行在 http://localhost:3000
```

### 步骤 4: 打开前端
用浏览器打开：
```
file:///[你的项目路径]/fitness-web-main/index.html
```

或使用 Live Server：
1. 在 VS Code 中安装 Live Server 扩展
2. 右键点击 `index.html` → Open with Live Server

## ✅ 验证设置成功

页面顶部应显示：`✓ 已连接到数据库` (绿色)

如果显示 `⚠️ 使用本地存储`，说明后端未连接。

## 🆘 快速排查

| 问题 | 解决方案 |
|-----|--------|
| 页面显示黄色警告 | 检查 MySQL 和 Node.js 是否启动 |
| npm install 失败 | 确保 Node.js 已安装 (`node -v`) |
| MySQL 连接失败 | 检查 `.env` 中的数据库密码 |
| 无法在浏览器中打开页面 | 使用完整路径或 Live Server |

## 🎯 下一步

- 查看 [主 README](README.md) 了解完整文档
- 查看 [API 文档](server/README.md) 了解 API 详情
- 开始记录你的训练数据！

---

**提示：** 第一次使用后，后端会自动创建所有需要的数据库表，无需手动操作。
