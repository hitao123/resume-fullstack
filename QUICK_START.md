# 🚀 快速启动指南

## 当前项目状态

### ✅ 已完成
- [x] Go 1.25.7 已安装
- [x] 前端所有依赖已安装并通过编译
- [x] 前端代码 TypeScript 错误已修复
- [x] 后端代码已完成
- [x] 数据库 Schema 已设计

### ⏳ 待完成
- [ ] Docker 安装
- [ ] MySQL 启动
- [ ] 后端服务启动
- [ ] 前端服务启动

---

## 一、安装数据库（二选一）

### 选项 1：Docker + MySQL（推荐）

**1. 安装 Docker Desktop**
- 下载：https://www.docker.com/products/docker-desktop/
- 安装后启动 Docker Desktop

**2. 启动 MySQL**
```bash
cd /Users/henryhua/gitProj/resume
docker compose up -d mysql

# 等待 10-15 秒
docker compose ps  # 检查状态
```

### 选项 2：本地 MySQL

```bash
# 安装 MySQL
brew install mysql@8.0

# 启动 MySQL
brew services start mysql@8.0

# 创建数据库和用户
mysql -u root << EOF
CREATE DATABASE resume_db;
CREATE USER 'resume_user'@'localhost' IDENTIFIED BY 'resume_password';
GRANT ALL PRIVILEGES ON resume_db.* TO 'resume_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

---

## 二、启动后端

```bash
cd /Users/henryhua/gitProj/resume/backend
go run cmd/server/main.go
```

**成功输出：**
```
Database connected successfully
Running database migrations...
Database migrations completed successfully
Server starting on port 8080...
[GIN-debug] Listening and serving HTTP on :8080
```

后端地址：http://localhost:8080

**测试后端：**
```bash
curl http://localhost:8080/health
# 应该返回：{"message":"Resume API is running","status":"ok"}
```

---

## 三、启动前端

**在新终端窗口：**
```bash
cd /Users/henryhua/gitProj/resume/frontend
npm run dev
```

**成功输出：**
```
VITE v7.3.1  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

前端地址：http://localhost:5173

---

## 四、测试应用

### 1. 注册账号
- 访问：http://localhost:5173/register
- 填写信息：
  - Name: Test User
  - Email: test@example.com
  - Password: password123

### 2. 登录
- 使用刚注册的账号登录
- 自动跳转到 Dashboard

### 3. 创建简历
- 点击 "New Resume" 按钮
- 输入简历标题：My First Resume
- 点击 "Create"

### 4. 查看功能
- Dashboard 显示简历列表
- 可以编辑、删除简历
- 点击简历卡片进入编辑器

---

## 五、常见问题

### Q1: 后端启动失败 - "Failed to connect to database"

**原因：** MySQL 未启动

**解决方案：**
```bash
# Docker 方式
docker compose ps  # 检查 MySQL 状态
docker compose up -d mysql  # 启动 MySQL

# 本地方式
brew services list  # 检查 MySQL 状态
brew services start mysql@8.0  # 启动 MySQL
```

### Q2: 前端访问后端报错 CORS

**原因：** 后端未启动或端口不对

**解决方案：**
1. 确认后端运行在 8080 端口
2. 检查 `frontend/.env` 文件：
   ```
   VITE_API_BASE_URL=http://localhost:8080
   ```

### Q3: 前端页面空白

**原因：** 可能是路由问题

**解决方案：**
1. 打开浏览器控制台（F12）查看错误
2. 确认访问 http://localhost:5173/login 或 /register

### Q4: 登录后显示空白

**原因：** 后端未启动或认证失败

**解决方案：**
1. 检查浏览器控制台的网络请求
2. 确认后端日志中有请求记录
3. 清除浏览器 localStorage：
   ```javascript
   // 在浏览器控制台运行
   localStorage.clear()
   ```

---

## 六、开发流程

### 每次开发开始

```bash
# 终端 1：启动 MySQL
docker compose up -d mysql  # 或本地 MySQL

# 终端 2：启动后端
cd /Users/henryhua/gitProj/resume/backend
go run cmd/server/main.go

# 终端 3：启动前端
cd /Users/henryhua/gitProj/resume/frontend
npm run dev
```

### 每次开发结束

```bash
# 终端 2 和 3：按 Ctrl+C 停止服务

# 如果使用 Docker，可以停止但不删除数据：
docker compose stop mysql

# 或者完全停止并删除：
docker compose down
```

---

## 七、API 测试（可选）

### 使用 curl 测试

**注册：**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**登录：**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

保存返回的 `accessToken`

**获取简历列表：**
```bash
curl -X GET http://localhost:8080/api/v1/resumes \
  -H "Authorization: Bearer <你的_access_token>"
```

---

## 八、项目目录

```
/Users/henryhua/gitProj/resume/
├── frontend/          # 前端项目 (npm run dev)
├── backend/           # 后端项目 (go run cmd/server/main.go)
├── docker-compose.yml # Docker 配置
├── README.md          # 项目说明
├── PROJECT_STATUS.md  # 详细状态
└── QUICK_START.md     # 本文件
```

---

## 九、下一步开发

当前已完成基础架构，下一步可以开发：

1. **完善简历编辑器**
   - PersonalInfoForm 组件
   - WorkExperienceList 组件
   - EducationForm 组件
   - SkillsManager 组件

2. **补充后端 API**
   - 工作经历 CRUD 端点
   - 教育背景 CRUD 端点
   - 技能管理端点

3. **实现 PDF 导出**
   - PDF 模板组件
   - 实时预览功能
   - 下载按钮

---

## 十、资源链接

- **前端依赖检查：** `frontend/DEPENDENCY_CHECK.md`
- **后端 README：** `backend/README.md`
- **项目状态：** `PROJECT_STATUS.md`
- **Ant Design 文档：** https://ant.design/components/overview/
- **React Router 文档：** https://reactrouter.com/
- **Gin 文档：** https://gin-gonic.com/docs/
- **GORM 文档：** https://gorm.io/docs/

---

**准备好了吗？开始开发吧！** 🚀

安装好 Docker/MySQL 后，按照上面的步骤启动项目即可。
