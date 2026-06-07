# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Layer Editor 是一个单用户在线图层编辑器，支持 AI 图像处理（火山引擎/豆包）。前端为 React + Konva 画布应用，后端为 Spring Boot REST API。

## 技术栈

- **后端：** Java 21, Spring Boot 3.3.6, Spring Cloud OpenFeign, MyBatis, PostgreSQL, Flyway, Lombok
- **前端：** React 19, TypeScript, Vite, react-konva, Zustand, TanStack Query, Ant Design 6, Axios
- **AI 集成：** 通过 OpenFeign + HttpClient5 调用火山引擎视觉 API（抠图、扩图、消除、超分辨率）

## 构建与运行命令

### 一键启动（仓库根目录）
```bash
bash start.sh          # Mac / Linux / Git Bash（自动检测 JDK 21、启动 PostgreSQL、创建数据库）
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
- 命名约定：`V{version}__{description}.sql`（双下划线）
- 已执行过的迁移文件不可修改，需新建迁移文件
- Flyway 使用 placeholders 生成默认用户密码哈希
- 数据库配置按 profile 区分：`application-mac.yml` / `application-windows.yml`
  - Windows profile：显式指定 `postgres/postgres` 凭据
  - Mac profile：使用系统当前用户名，无密码

### 后端测试
```bash
cd backend
mvn test                # 运行全部测试
mvn test -Dtest=AssetServiceTest   # 运行单个测试类
```
测试使用 `@SpringBootTest` 集成测试，需要数据库可用。

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

### 路由
- `/` — 文档列表页（DocumentListPage）
- `/editor/:id` — 编辑器页（EditorPage）
- 使用 React Router v7 的 `createBrowserRouter`

### Zustand Store 组合模式
Store 由多个 slice 通过对象展开组合而成：
```typescript
export const useEditorStore = create<EditorState>((set, get) => ({
  ...createDocumentSlice(set, get),
  ...createSelectionSlice(set, get),
  ...createClipboardSlice(set, get),
  ...createViewportSlice(set, get),
  ...createUiPreferencesSlice(set, get),
  ...createDrawingSlice(set, get),
  ...createLayerSlice(set, get),
}));
```
类型 `EditorState` 是所有 slice 类型的交叉类型。每个 slice 接收 `set` 和 `get`，导出 actions 接口和 `createXxxSlice(set, get)` 工厂函数。

**关键细节：** `updateLayerPatchDebounced` 使用全局 300ms 防抖定时器，文档切换时必须调用 `cancelPendingLayerPatch()` 清理，否则会残留对已卸载文档的写入。

### API 客户端模式
前端 API 响应拦截器已自动解包 `ApiResponse<T>`：成功时直接返回 `data` 字段（code=0），非零 code 抛出 Error。API 函数签名统一为：
```typescript
export async function getXxx(...): Promise<T> {
  const res = await api.get('/path');
  return res.data;  // 已经是 ApiResponse.data，不是 Axios response
}
```

### Provider 嵌套顺序
`StrictMode → AppProviders (QueryClientProvider → ConfigProvider → RouterProvider)`

TanStack Query 配置：`retry: 1`、`refetchOnWindowFocus: false`。Ant Design 主题：`borderRadius: 4`。

## 环境变量

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `SPRING_PROFILE` | `windows` | 激活的 Spring Profile |
| `APP_AUTH_USERNAME` | `editor` | HTTP Basic 认证用户名 |
| `APP_AUTH_PASSWORD` | `editor` | HTTP Basic 认证密码 |
| `VOLC_ACCESS_KEY` | *(空)* | 火山引擎 Access Key |
| `VOLC_SECRET_KEY` | *(空)* | 火山引擎 Secret Key |
| `VITE_API_USERNAME` | `editor` | 前端 Basic Auth 用户名 |
| `VITE_API_PASSWORD` | `editor` | 前端 Basic Auth 密码 |

未配置火山引擎密钥时，AI 功能优雅降级 —— 按钮显示为禁用状态，不会报错。

## API 路由

- 文档：`GET/POST/PUT/DELETE /api/documents`、`PATCH /api/documents/{id}/content`
- 素材：`GET/POST/DELETE /api/assets`
- AI：`GET /api/ai/status`，`POST /api/ai/{matting|outpainting|inpainting|super-resolution}`
- 版本：`GET/POST /api/documents/{id}/revisions`
- 静态文件：从 `./uploads` 目录服务，路径 `/uploads/*`

## 开发约定

- 后端使用 `@ConfigurationProperties`（前缀 `app.*`）管理自定义配置，不使用 `@Value`
- 后端依赖注入使用 `@RequiredArgsConstructor`（Lombok 构造器注入），不使用 `@Autowired`
- 后端通过 `UserContext.getCurrentUserId()` 获取当前用户 ID（非显式传参）
- 文档保存支持乐观并发控制：`currentVersion` 字段防止覆盖，冲突返回 409
- 内容通过 `ContentValidator.validateAndSanitize()` 做输入校验和 XSS 防护
- OpenFeign `loggerLevel` 需配合 `logging.level.com.example.editor.ai.client: DEBUG` 才能实际输出请求日志
- 火山引擎 Feign 客户端超时为 60s（默认 10s），因为 AI 处理耗时较长
- 前端使用 Zustand slice 模式 —— 每个关注点（图层、选择、工具等）为独立 slice 文件
- 每个 layer 操作后必须调用 `pushHistory()` + 设置 `isDirty: true` + `syncHistoryState()`
- MyBatis 全局启用下划线转驼峰映射（`map-underscore-to-camel-case: true`）
- 所有 API 响应使用 `ApiResponse<T>` 封装，包含 code/message/data 结构（code=0 为成功）
- 前端 Vite 构建使用手动分包：Konva、Ant Design、React 各自独立 chunk

## docs/ 技术文档

`docs/` 存放与本项目及周边技术的学习笔记和深度分析，不属于应用代码的一部分。按主题分为：

| 主题 | 文档 | 说明 |
|------|------|------|
| **OpenFeign** | `OpenFeign日志配置完全指南.md` | OpenFeign 双重日志配置原理 |
| | `OpenFeign-HttpClient5-超时与连接池配置指南.md` | 超时分层、连接池容量估算、本项目配置落点 |
| | `openfeign-timeout-config.md` | 特定 `contextId` 下的超时配置方法 |
| | `Spring-Cloud-OpenFeign-配置优先级源码解读.md` | `FeignClientFactoryBean` 源码中的配置优先级机制 |
| **Kong 网关** | `kong-access-log-guide.md` | access log 四指标（rt/uct/uht/urt）定位性能瓶颈 |
| | `kong-diagnose-prompt-for-gemini.md` | 用于 Gemini 的 Kong 诊断 System Prompt |
| **数据库** | `pg-partition-index-guide.md` | PostgreSQL 分区表在线建索引的步骤与注意事项 |
| **架构/通用** | `灰度发布的挑战与解决方案.md` | 灰度发布中 Schema 兼容、指标隔离等常见问题 |
| | `RateLimiter-滑动窗口限流器.md` | Java 滑动窗口限流器实现 |
| | `金融行业专用AI-Agent分析.md` | 金融行业私有化 AI Agent 的需求分析 |

## 安全

- 所有 `/api/**` 端点使用 HTTP Basic 认证
- CORS 允许 `localhost:5173–5179` 和 `localhost:3000`
- SSRF 防护拦截 AI 请求中的私有网络 URL
- SVG 上传经过消毒处理防止 XSS
- 文件上传校验类型和大小（最大 50MB）
