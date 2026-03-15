# Online Resume Editor

一个现代化的全栈在线简历编辑器，支持实时预览、富文本编辑、AI 智能辅助、OAuth 三方登录和多种 PDF 导出方式。

## ✨ 项目特性

### 用户认证
- 邮箱注册 / 密码登录（JWT 双 Token 认证）
- OAuth 三方登录：GitHub / Google / WeChat
- Token 自动刷新 + 请求队列重试

### 简历管理
- 创建和管理多份简历
- 一键复制简历
- 新用户注册自动创建含示例数据的默认简历

### 编辑体验
- 分段编辑：个人信息、工作经历、教育背景、技能、项目经历
- 富文本编辑（TipTap）：支持加粗、斜体、有序/无序列表
- 实时预览简历样式（左右分栏布局）
- 条目拖拽排序
- 数据自动保存

### AI 智能辅助
- AI 生成个人摘要（基于 OpenAI，SSE 流式输出）
- AI 增强工作描述 / 项目描述

### PDF 导出
- **React PDF（矢量）**：文字可选中，适合 ATS 解析
- **截图导出（html2canvas + jsPDF）**：完整保留 SVG 图标和样式
- 多模板支持（经典 / 现代 / 增强）

### 其他
- 中英文国际化（i18n）
- XSS 防护（DOMPurify）
- 响应式布局

## 🛠 技术栈

### 前端
| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React + TypeScript | 19.2 / 5.9 |
| 构建工具 | Vite | 7.3 |
| UI 组件 | Ant Design | 5.22 |
| 状态管理 | Zustand | 5.0 |
| 路由 | React Router | 7.1 |
| 表单 | React Hook Form | 7.54 |
| HTTP | Axios + Fetch (SSE) | — |
| 服务端状态 | TanStack React Query | 5.62 |
| 富文本 | TipTap | 3.20 |
| PDF 生成 | @react-pdf/renderer + html2canvas + jsPDF | — |
| 国际化 | i18next | 25.8 |
| 安全 | DOMPurify | 3.3 |

### 后端
| 类别 | 技术 | 版本 |
|------|------|------|
| 语言 | Go | 1.21+ |
| Web 框架 | Gin | 1.10 |
| ORM | GORM | 1.25 |
| 数据库 | MySQL | 8.0 |
| 认证 | JWT (HMAC-SHA256) + bcrypt | — |
| OAuth | GitHub / Google / WeChat | — |
| AI | OpenAI API (streaming) | — |

## 📁 项目结构

```
resume/
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── pages/              # 页面（Login、Register、OAuthCallback、Dashboard、ResumeEditor）
│   │   ├── components/
│   │   │   ├── auth/           # 认证组件（ProtectedRoute、SocialLoginButtons）
│   │   │   ├── layout/         # 布局组件（Header、Footer、MainLayout）
│   │   │   ├── resume/         # 简历编辑/预览组件（各 Section 表单 + ResumePreview）
│   │   │   ├── pdf/            # PDF 模板（Classic、Modern、Enhanced）
│   │   │   ├── ai/             # AI 助手组件（AIAssistantButton、AIResultPanel）
│   │   │   ├── common/         # 通用组件（RichTextEditor、SafeHtmlRenderer、LanguageSwitcher）
│   │   │   └── landing/        # Landing 页组件（预留）
│   │   ├── hooks/              # 自定义 Hooks（useAuth、useResume、useAutoSave、useAIAssistant、usePDFExport）
│   │   ├── services/           # API 服务（api、auth、resume、ai）
│   │   ├── store/              # Zustand 状态管理（authStore、resumeStore）
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── utils/              # 工具函数
│   │   └── i18n/               # 国际化资源（zh-CN、en-US）
│   ├── Dockerfile              # 多阶段构建 → Nginx 静态服务
│   └── package.json
├── backend/                    # Go 后端 API
│   ├── cmd/server/             # 应用入口
│   ├── config/                 # 配置（环境变量 + OAuth）
│   ├── internal/
│   │   ├── api/
│   │   │   ├── routes/         # 路由注册
│   │   │   ├── middleware/     # 中间件（Auth JWT + CORS）
│   │   │   └── handlers/       # 处理器（Auth、OAuth、Resume、AI）
│   │   ├── service/            # 服务层（OAuth、AI）
│   │   ├── domain/models/      # GORM 数据模型（11 张表）
│   │   └── dto/                # 请求/响应 DTO
│   ├── pkg/
│   │   ├── auth/               # JWT + bcrypt 工具
│   │   └── database/           # MySQL 连接 + 自动迁移
│   ├── Dockerfile              # 多阶段构建 → Alpine 运行
│   └── go.mod
└── docker-compose.yml          # 容器编排（MySQL + 后端）
```

## 🚀 快速开始

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

## ⚙️ 环境变量

### 后端 (.env)

复制 `.env.example` 并根据实际环境修改：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_NAME=resume_db

# JWT 认证
JWT_SECRET=<your_jwt_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

# 服务
PORT=8080
GIN_MODE=debug

# AI（可选）
AI_API_KEY=<your_openai_api_key>
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1

# GitHub OAuth（可选）
GITHUB_CLIENT_ID=<your_github_client_id>
GITHUB_CLIENT_SECRET=<your_github_client_secret>
GITHUB_REDIRECT_URI=http://localhost:8080/api/v1/auth/oauth/github/callback

# Google OAuth（可选）
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_REDIRECT_URI=http://localhost:8080/api/v1/auth/oauth/google/callback

# WeChat OAuth（可选）
WECHAT_APP_ID=<your_wechat_app_id>
WECHAT_APP_SECRET=<your_wechat_app_secret>
WECHAT_REDIRECT_URI=http://localhost:8080/api/v1/auth/oauth/wechat/callback

# OAuth 前端回调
OAUTH_FRONTEND_CALLBACK_URL=http://localhost:5173/oauth/callback
```

### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:8080
```

## 📡 API 接口

Base URL: `http://localhost:8080/api/v1`

### 健康检查
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /health | 服务健康检查 | 否 |

### 认证
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /auth/register | 用户注册 | 否 |
| POST | /auth/login | 用户登录 | 否 |
| POST | /auth/refresh | 刷新令牌 | 否 |
| POST | /auth/logout | 用户登出 | 否 |
| POST | /auth/me | 获取当前用户 | ✅ |

### OAuth 三方登录
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /auth/oauth/:provider | 发起 OAuth 授权（github / google / wechat） | 否 |
| GET | /auth/oauth/:provider/callback | OAuth 回调处理 | 否 |

### 简历管理
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /resumes/list | 获取简历列表 | ✅ |
| POST | /resumes | 创建简历 | ✅ |
| POST | /resumes/get | 获取完整简历 | ✅ |
| POST | /resumes/update | 更新简历 | ✅ |
| DELETE | /resumes/:id | 删除简历 | ✅ |
| POST | /resumes/:id/duplicate | 复制简历 | ✅ |

### 简历子模块

各子模块的基础路径：`/resumes/{section}`

| 子模块 | 路由前缀 | 支持操作 |
|--------|----------|----------|
| 个人信息 | /resumes/personal-info | get, update |
| 工作经历 | /resumes/work-experiences | list, create, update, delete, reorder |
| 教育背景 | /resumes/education | list, create, update, delete, reorder |
| 技能 | /resumes/skills | list, create, update, delete, bulk |
| 项目经历 | /resumes/projects | list, create, update, delete |

### AI 智能辅助
| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /ai/generate-summary | AI 生成个人摘要（SSE 流式返回） | ✅ |
| POST | /ai/enhance-description | AI 增强描述（SSE 流式返回） | ✅ |

## 🗄 数据库

应用启动时通过 GORM AutoMigrate 自动执行数据库迁移，创建以下 11 张表：

| 表名 | 说明 |
|------|------|
| `users` | 用户账号（支持软删除） |
| `oauth_providers` | OAuth 三方登录关联 |
| `resumes` | 简历文档（支持软删除） |
| `personal_infos` | 个人信息（每简历一份） |
| `work_experiences` | 工作经历 |
| `educations` | 教育背景 |
| `skills` | 技能 |
| `projects` | 项目经历 |
| `certifications` | 证书（模型已建，API 待实现） |
| `languages` | 语言能力（模型已建，API 待实现） |
| `refresh_tokens` | JWT 刷新令牌 |

## 🐛 故障排除

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

**OAuth 回调错误**

确保 OAuth App 中配置的回调 URL 与 `.env` 中的值**完全一致**：
- GitHub: `http://localhost:8080/api/v1/auth/oauth/github/callback`
- Google: `http://localhost:8080/api/v1/auth/oauth/google/callback`

## 🚢 部署

```bash
# Docker Compose 一键启动（MySQL + 后端）
docker-compose up -d

# 或分别构建
cd backend && docker build -t resume-backend .
cd frontend && docker build -t resume-frontend .
```

## 📄 License

MIT
