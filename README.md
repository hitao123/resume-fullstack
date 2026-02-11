# Online Resume Editor

一个现代化的在线简历编辑器，支持 PC 端编辑、实时预览和 PDF 导出功能。

## 🚀 项目特性

- ✅ 用户注册和登录（JWT 认证）
- ✅ 创建和管理多份简历
- ✅ 实时编辑个人信息、工作经历、教育背景、技能等
- ✅ 实时预览简历样式
- ✅ 导出高质量 PDF 文件
- ✅ 数据自动保存
- ✅ 拖拽排序

## 技术栈

### 前端
- React 18 + TypeScript
- Vite (Build Tool)
- Ant Design (UI Components)
- Zustand (State Management)
- @react-pdf/renderer (PDF Generation)
- React Hook Form (Form Handling)
- Axios (HTTP Client)
- React Router (Routing)
- date-fns (Date Utilities)

### 后端
- Go 1.21+
- Gin (Web Framework)
- GORM (ORM)
- MySQL 8.0
- JWT Authentication
- bcrypt (Password Hashing)

## 项目结构

```
resume/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # State management
│   │   ├── hooks/         # Custom hooks
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Go backend API
│   ├── cmd/               # Application entry
│   ├── internal/          # Internal packages
│   │   ├── api/           # HTTP handlers & routes
│   │   ├── domain/        # Domain models
│   │   └── dto/           # Data transfer objects
│   ├── pkg/               # Public packages
│   │   ├── auth/          # Auth utilities
│   │   └── database/      # Database utilities
│   ├── config/            # Configuration
│   └── go.mod
├── docker-compose.yml # Development environment
├── README.md
└── PROJECT_STATUS.md  # Detailed project status
```

## 快速开始

### 前置条件
- Node.js 18+ and npm
- Go 1.21+
- Docker and Docker Compose
- MySQL 8.0 (or use Docker)

### 安装 Go

**macOS:**
```bash
brew install go
```

**验证安装:**
```bash
go version
```

### 开发环境设置

**1. 克隆项目**
```bash
git clone <repository-url>
cd resume
```

**2. 启动 MySQL**
```bash
docker-compose up -d mysql
```

等待 MySQL 启动（约 10-15 秒）

**3. 启动后端**
```bash
cd backend
go mod download       # 下载依赖
cp .env.example .env  # 如果还没有 .env 文件
go run cmd/server/main.go
```

后端将运行在 http://localhost:8080

你应该看到：
```
Database connected successfully
Running database migrations...
Database migrations completed successfully
Server starting on port 8080...
```

**4. 启动前端（新终端窗口）**
```bash
cd frontend
npm install           # 如果还没有安装依赖
npm run dev
```

前端将运行在 http://localhost:5173

### 测试应用

1. 访问 http://localhost:5173
2. 点击 "Sign up" 注册新账号
3. 登录系统
4. 在 Dashboard 创建新简历
5. 编辑简历内容
6. 导出 PDF（待实现）

## 环境变量

### 后端 (.env)
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=resume_user
DB_PASSWORD=resume_password
DB_NAME=resume_db

JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

PORT=8080
GIN_MODE=debug
```

### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
```

## API 文档

Base URL: `http://localhost:8080/api/v1`

### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/refresh` - 刷新访问令牌
- `POST /auth/logout` - 用户登出
- `GET /auth/me` - 获取当前用户信息

### 简历管理
- `GET /resumes` - 获取用户所有简历列表
- `POST /resumes` - 创建新简历
- `GET /resumes/:id` - 获取完整简历（含所有sections）
- `PUT /resumes/:id` - 更新简历元数据
- `DELETE /resumes/:id` - 删除简历

### 简历各部分
每个部分遵循类似模式：
- `GET /resumes/:resumeId/{section}` - 获取列表
- `POST /resumes/:resumeId/{section}` - 创建
- `PUT /resumes/:resumeId/{section}/:id` - 更新
- `DELETE /resumes/:resumeId/{section}/:id` - 删除

Sections: `personal-info`, `work-experiences`, `education`, `skills`, `projects`, `certifications`, `languages`

详细 API 文档请参见：[backend/README.md](backend/README.md)

## 开发进度

当前项目进度：约 **75% 完成**

### ✅ 已完成
- 项目基础架构
- 前端核心框架（React + TypeScript）
- 后端核心框架（Go + Gin）
- 用户认证系统（JWT）
- 简历 CRUD 功能
- 基础 UI 组件
- 数据库模型和迁移

### 🚧 开发中
- 简历编辑器详细实现
- 工作经历/教育/技能表单组件
- PDF 模板和生成
- 拖拽排序功能

### 📋 待开发
- 项目经历、证书、语言管理
- 富文本编辑器集成
- 多模板支持
- 简历复制功能
- 单元测试

详细状态请查看：[PROJECT_STATUS.md](PROJECT_STATUS.md)

## 数据库 Schema

应用将自动创建以下表：

- `users` - 用户账户
- `resumes` - 简历文档
- `personal_info` - 个人信息
- `work_experiences` - 工作经历
- `education` - 教育背景
- `skills` - 技能
- `projects` - 项目经历
- `certifications` - 证书
- `languages` - 语言能力
- `refresh_tokens` - JWT 刷新令牌

## 开发工具

**推荐 IDE:**
- VS Code + Go Extension
- VS Code + React Extension

**推荐工具:**
- Postman / Insomnia (API 测试)
- TablePlus / MySQL Workbench (数据库管理)
- React DevTools (前端调试)

## 故障排除

**后端启动失败 - "command not found: go"**
```bash
# 安装 Go
brew install go

# 验证安装
go version
```

**数据库连接失败**
```bash
# 检查 MySQL 是否运行
docker ps

# 重启 MySQL
docker-compose restart mysql

# 查看日志
docker-compose logs mysql
```

**前端启动失败**
```bash
# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

**端口被占用**
```bash
# 查看端口占用
lsof -ti:8080  # 后端
lsof -ti:5173  # 前端

# 杀死进程
lsof -ti:8080 | xargs kill
```

## 部署

### Docker 部署

**构建镜像：**
```bash
# 后端
cd backend
docker build -t resume-backend .

# 前端
cd frontend
docker build -t resume-frontend .
```

**使用 Docker Compose 启动全部服务：**
```bash
docker-compose up -d
```

## 开发时间线

- Week 1-2: 项目搭建和基础架构 ✅
- Week 3-4: 认证系统和简历管理 ✅
- Week 5-6: 简历编辑器和表单组件 🚧
- Week 7: PDF 导出功能 📋
- Week 8: 优化和测试 📋

## 贡献指南

欢迎提交 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

MIT License

## 联系方式

项目链接: [https://github.com/henryhua/resume-backend](https://github.com/henryhua/resume-backend)

---

**开发中遇到问题？** 查看 [PROJECT_STATUS.md](PROJECT_STATUS.md) 或 [backend/README.md](backend/README.md)

