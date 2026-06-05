# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

Layer Editor 是一个单用户在线图层编辑器，支持 AI 图像处理（火山引擎/豆包）。前端为 React + Konva 画布应用，后端为 Spring Boot REST API。

## 技术栈

- **后端：** Java 21, Spring Boot 3.3.6, Spring Cloud OpenFeign, MyBatis, PostgreSQL, Flyway, Lombok
- **前端：** React 19, TypeScript, Vite, react-konva, Zustand, TanStack Query, Ant Design 6, Axios
- **AI 集成：** 通过 OpenFeign + HttpClient5 调用火山引擎视觉 API（抠图、扩图、消除、超分辨率）

## 构建与运行命令

### 一键启动（仓库根目录）
```bash
bash start.sh          # Mac / Linux / Git Bash
# 或 Windows 下双击 start.bat
```

### 后端（`backend/` 目录）
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=windows   # Windows
mvn spring-boot:run -Dspring-boot.run.profiles=mac       # Mac
```
运行在 8080 端口。需要 JDK 21、PostgreSQL 5432 端口、`layer_editor` 数据库。

### 前端（`frontend/` 目录）
```bash
npm install
npm run dev      # 开发服务器 :5173，代理 /api 和 /uploads 到 :8080
npm run build    # tsc + vite 构建
npm run lint     # eslint 检查
```

### 数据库
- PostgreSQL 16，数据库名 `layer_editor`
- Flyway 自动执行 `backend/src/main/resources/db/migration/` 下的迁移脚本
- 只做 schema 迁移 —— 已执行过的迁移文件不可修改，需新建迁移文件
- 数据库配置按 profile 区分：`application-mac.yml` / `application-windows.yml`

## 架构

### 后端包结构（`com.example.editor`）
每个领域模块遵循 `controller → service → mapper → entity` 分层：

| 包 | 职责 |
|---|------|
| `document/` | 文档 CRUD；内容以 JSONB 存储在 `editor_document.content` |
| `asset/` | 图片上传/服务；文件存储在 `./uploads` |
| `revision/` | 文档版本快照 |
| `ai/` | 火山引擎 AI 集成 — Feign 客户端在 `ai/client/`，业务逻辑在 `ai/service/` |
| `common/config/` | HttpClient5 连接池、CORS、安全配置 |
| `common/security/` | HTTP Basic 认证、SSRF 过滤器、SVG 消毒 |
| `common/exception/` | 全局异常处理 |
| `common/response/` | 统一 `ApiResponse<T>` 响应封装 |

MyBatis XML 映射文件位于 `src/main/resources/mapper/*.xml`。

### 前端结构（`frontend/src/`）
- **`features/editor/`** — 编辑器全部逻辑
  - `api/` — 基于 Axios 的 API 客户端（document、asset、revision、aiImage）
  - `store/` — Zustand 状态管理，采用 slice 模式（`store/slices/`）
  - `components/` — canvas（画布）、panel（属性面板/图层树）、layout（布局）、picker（素材选择器）
  - `types/` — TypeScript 类型定义
  - `hooks/`、`utils/` — 编辑器工具函数
- **`pages/`** — 路由页面（`document-list/`、`editor/`）
- **`shared/`** — 跨功能共享组件
- 路径别名 `@` → `src/`（在 `vite.config.ts` 中配置）

### 核心数据流
- 前端 Konva 画布状态由 Zustand store 管理（slice 模式）
- 文档内容（所有图层、位置、变换）作为单个 JSONB 整体持久化
- 图片图层通过 `assetId` 引用 `editor_asset` 表进行二进制存储
- 前端通过 Vite 开发服务器代理将 `/api/*` 和 `/uploads/*` 转发到后端

## 环境变量

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `SPRING_PROFILE` | `windows` | 激活的 Spring Profile |
| `APP_AUTH_USERNAME` | `editor` | HTTP Basic 认证用户名 |
| `APP_AUTH_PASSWORD` | `editor` | HTTP Basic 认证密码 |
| `VOLC_ACCESS_KEY` | *(空)* | 火山引擎 Access Key |
| `VOLC_SECRET_KEY` | *(空)* | 火山引擎 Secret Key |

未配置火山引擎密钥时，AI 功能优雅降级 —— 按钮显示为禁用状态，不会报错。

## API 路由

- 文档：`GET/POST/PUT/DELETE /api/documents`
- 素材：`GET/POST/DELETE /api/assets`
- AI：`GET /api/ai/status`，`POST /api/ai/{matting|outpainting|inpainting|super-resolution}`
- 版本：`GET/POST /api/documents/{id}/revisions`
- 静态文件：从 `./uploads` 目录服务，路径 `/uploads/*`

## 开发约定

- 后端使用 `@ConfigurationProperties`（前缀 `app.*`）管理自定义配置，不使用 `@Value`
- OpenFeign `loggerLevel` 需配合 `logging.level.com.example.editor.ai.client: DEBUG` 才能实际输出请求日志
- 火山引擎 Feign 客户端超时为 60s（默认 10s），因为 AI 处理耗时较长
- 前端使用 Zustand slice 模式 —— 每个关注点（图层、选择、工具等）为独立 slice 文件
- MyBatis 全局启用下划线转驼峰映射（`map-underscore-to-camel-case: true`）
- 所有 API 响应使用 `ApiResponse<T>` 封装，包含 code/message/data 结构

## 安全

- 所有 `/api/**` 端点使用 HTTP Basic 认证
- CORS 允许 `localhost:5173–5179` 和 `localhost:3000`
- SSRF 防护拦截 AI 请求中的私有网络 URL
- SVG 上传经过消毒处理防止 XSS
- 文件上传校验类型和大小（最大 50MB）
