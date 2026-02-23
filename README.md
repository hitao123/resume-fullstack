# Online Resume Editor

一个现代化的在线简历编辑器，支持实时预览、富文本编辑和多种 PDF 导出方式。

## 项目特性

- 用户注册和登录（JWT 认证）
- 创建和管理多份简历
- 富文本编辑（TipTap）：支持加粗、斜体、有序/无序列表
- 实时预览简历样式
- 双模式 PDF 导出：
  - **React PDF（矢量）**：文字可选中，适合 ATS 解析
  - **截图导出（html2canvas + jsPDF）**：完整保留 SVG 图标和样式
- 多模板支持（经典 / 现代）
- 数据自动保存
- 中英文国际化

## 技术栈

### 前端
- React 19 + TypeScript 5.9
- Vite 7
- Ant Design 5（UI 组件）
- TipTap（富文本编辑器）
- Zustand（状态管理）
- @react-pdf/renderer（矢量 PDF 生成）
- html2canvas + jsPDF（截图式 PDF 生成）
- DOMPurify（XSS 防护）
- React Router（路由）
- i18next（国际化）
- Axios（HTTP 客户端）

### 后端
- Go 1.21+
- Gin（Web 框架）
- GORM（ORM）
- MySQL 8.0
- JWT 认证
- bcrypt（密码加密）

## 项目结构

```
resume/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # 通用组件（RichTextEditor、SafeHtmlRenderer 等）
│   │   │   ├── layout/        # 布局组件
│   │   │   ├── pdf/           # PDF 模板（Classic、Modern、Enhanced）
│   │   │   ├── resume/        # 简历编辑/预览组件
│   │   │   └── auth/          # 认证组件
│   │   ├── pages/             # 页面（Dashboard、ResumeEditor、Login、Register）
│   │   ├── hooks/             # 自定义 Hooks（usePDFExport 等）
│   │   ├── services/          # API 服务
│   │   ├── store/             # Zustand 状态管理
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── utils/             # 工具函数（htmlToPdfNodes、pdfHelpers 等）
│   │   └── i18n/              # 国际化资源（zh-CN、en-US）
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Go 后端 API
│   ├── cmd/                   # 应用入口
│   ├── internal/
│   │   ├── api/               # HTTP 路由和处理器
│   │   ├── domain/            # 领域模型
│   │   └── dto/               # 数据传输对象
│   ├── pkg/
│   │   ├── auth/              # 认证工具
│   │   └── database/          # 数据库工具
│   ├── config/                # 配置
│   └── go.mod
└── docker-compose.yml     # 开发环境
```

## 快速开始

### 前置条件
- Node.js 18+
- Go 1.21+
- Docker / Docker Compose
- MySQL 8.0（或通过 Docker 启动）

### 1. 克隆项目
```bash
git clone https://github.com/hitao123/resume-fullstack
cd resume
```

### 2. 启动 MySQL
```bash
docker-compose up -d mysql
```

### 3. 启动后端
```bash
cd backend
go mod download
cp .env.example .env   # 根据实际环境修改配置
go run cmd/server/main.go
```
后端运行在 http://localhost:8080

### 4. 启动前端
```bash
cd frontend
npm install
npm run dev
```
前端运行在 http://localhost:5173

## 环境变量

### 后端 (.env)

复制 `.env.example` 并根据实际环境修改：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_NAME=resume_db

JWT_SECRET=<your_jwt_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

PORT=8080
GIN_MODE=debug
```

### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
```

## API 接口

Base URL: `http://localhost:8080/api/v1`

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/register | 用户注册 |
| POST | /auth/login | 用户登录 |
| POST | /auth/refresh | 刷新令牌 |
| POST | /auth/logout | 用户登出 |
| GET  | /auth/me | 获取当前用户 |

### 简历管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET    | /resumes | 获取简历列表 |
| POST   | /resumes | 创建简历 |
| GET    | /resumes/:id | 获取完整简历 |
| PUT    | /resumes/:id | 更新简历 |
| DELETE | /resumes/:id | 删除简历 |

### 简历子模块

各子模块遵循统一的 RESTful 模式：`/resumes/:resumeId/{section}[/:id]`

支持的 section：`personal-info`、`work-experiences`、`education`、`skills`、`projects`、`certifications`、`languages`

## 数据库

应用启动时自动执行数据库迁移，创建以下表：

`users`、`resumes`、`personal_info`、`work_experiences`、`education`、`skills`、`projects`、`certifications`、`languages`、`refresh_tokens`

## 故障排除

**数据库连接失败**
```bash
docker ps                      # 检查 MySQL 是否运行
docker-compose restart mysql   # 重启
docker-compose logs mysql      # 查看日志
```

**前端依赖问题**
```bash
rm -rf node_modules package-lock.json
npm install
```

**端口被占用**
```bash
lsof -ti:8080 | xargs kill    # 后端
lsof -ti:5173 | xargs kill    # 前端
```

## 部署

```bash
# Docker Compose 一键启动
docker-compose up -d

# 或分别构建
cd backend && docker build -t resume-backend .
cd frontend && docker build -t resume-frontend .
```

## License

MIT
