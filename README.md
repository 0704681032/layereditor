# Layer Editor - 图层编辑器

专业的在线图层编辑器，支持图层管理、素材库、AI图像处理。

## 功能概览

### 核心编辑功能
- **图层管理** - 添加、删除、排序、锁定、显隐
- **形状绘制** - 矩形、圆形、多边形、线条
- **文本编辑** - 字体、大小、颜色、样式
- **图片处理** - 本地上传、素材库选择
- **SVG导入** - 支持SVG/Sketch文件解析导入
- **分组功能** - 图层分组与嵌套
- **变换操作** - 拖拽、缩放、旋转、对齐
- **剪贴板** - 复制、粘贴、跨文档复用
- **撤销重做** - 完整的历史操作记录
- **导出功能** - PNG/JPEG/WebP/PDF/SVG，支持1x-4x分辨率

### AI图像处理（火山引擎/豆包）
- **智能抠图** - 人像抠图、通用物体抠图
- **AI扩图** - 智能扩展图片边界
- **消除笔** - 消除图片中的杂物、水印
- **超分辨率** - 图片画质增强（2x/4x）

## 技术栈

### 前端
- React 19 + TypeScript
- Vite 8 构建工具
- react-konva 画布渲染
- Zustand 状态管理（slice 模式）
- TanStack Query 数据请求
- Ant Design 6 UI组件
- Axios HTTP 客户端

### 后端
- Java 21 + Spring Boot 3.3.6
- Spring Cloud OpenFeign 2023.0.3
- Apache HttpClient5（Feign 底层 HTTP 实现）
- MyBatis 数据访问
- Flyway 数据库迁移
- PostgreSQL 16
- Lombok

### 安全特性
- HTTP Basic 认证
- CORS 多端口支持（5173-5179, 3000）
- SSRF防护（禁止私有网络URL）
- 文件上传类型校验（最大50MB）
- SVG Sanitizer（XSS防护）
- MyBatis 参数绑定（SQL注入防护）

## 项目结构

```
layereditor/
├── backend/                          # Spring Boot 后端
│   └── src/main/java/com/example/editor/
│       ├── ai/                       # AI图像处理模块
│       │   ├── client/               # OpenFeign 客户端（VolcengineVisualClient）
│       │   ├── config/               # 火山引擎配置
│       │   ├── controller/           # AI API 控制器
│       │   ├── dto/                  # 数据传输对象
│       │   └── service/              # AI 服务层
│       ├── asset/                    # 素材管理模块
│       │   ├── controller/           # 素材上传/查询/删除
│       │   ├── entity/               # EditorAsset 实体
│       │   ├── mapper/               # MyBatis 映射器
│       │   └── service/              # 素材服务
│       ├── document/                 # 文档管理模块
│       │   ├── entity/               # EditorDocument 实体（content 为 JSONB）
│       │   └── ...
│       ├── revision/                 # 版本历史模块
│       │   ├── entity/               # EditorDocumentRevision 实体
│       │   └── ...
│       └── common/
│           ├── config/               # HttpClient5 连接池、CORS、Web 配置
│           ├── exception/            # 全局异常处理（BusinessException 等）
│           ├── response/             # 统一 ApiResponse<T> 封装
│           ├── security/             # Spring Security 配置
│           └── util/                 # 工具类（SvgSanitizer、ImageUtils 等）
│
├── frontend/                         # React 前端
│   └── src/
│       ├── features/editor/
│       │   ├── api/                  # API 客户端（aiImage、document、asset、revision）
│       │   ├── components/
│       │   │   ├── canvas/           # 画布组件
│       │   │   ├── panel/            # 属性面板、图层树
│       │   │   ├── layout/           # 编辑器布局
│       │   │   └── picker/           # 素材选择器
│       │   ├── store/slices/         # Zustand 状态切片
│       │   │   ├── layerSlice        # 图层管理
│       │   │   ├── selectionSlice    # 选择状态
│       │   │   ├── drawingSlice      # 绘图工具
│       │   │   ├── clipboardSlice    # 剪贴板
│       │   │   ├── documentSlice     # 文档状态
│       │   │   ├── viewportSlice     # 视口变换
│       │   │   └── uiPreferencesSlice # UI 偏好
│       │   ├── types/                # TypeScript 类型定义
│       │   ├── hooks/                # 自定义 Hooks
│       │   └── utils/                # 工具函数
│       ├── pages/
│       │   ├── document-list/        # 文档列表页
│       │   └── editor/               # 编辑器页面
│       └── shared/                   # 共享组件
│
├── docs/                             # 技术文档（OpenFeign、Kong、限流等）
├── docker-compose.yml                # PostgreSQL 容器配置
├── start.sh / start.bat              # 一键启动脚本
└── CLAUDE.md                         # Claude Code 项目指导
```

## API 接口

### 文档 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/documents?page=0&size=20` | 文档列表 |
| GET | `/api/documents/{id}` | 文档详情 |
| POST | `/api/documents` | 创建文档 |
| PUT | `/api/documents/{id}` | 更新文档 |
| DELETE | `/api/documents/{id}` | 删除文档 |

### 素材 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 素材列表 |
| GET | `/api/assets/{id}` | 素材详情 |
| POST | `/api/assets/upload` | 上传素材 |
| DELETE | `/api/assets/{id}` | 删除素材 |

### AI 图像处理 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/ai/status` | AI服务状态 |
| POST | `/api/ai/matting` | 智能抠图 |
| POST | `/api/ai/outpainting` | AI扩图 |
| POST | `/api/ai/inpainting` | 消除笔 |
| POST | `/api/ai/super-resolution` | 超分辨率 |

### 版本历史 API
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/documents/{id}/revisions` | 版本列表 |
| POST | `/api/documents/{id}/revisions` | 创建版本快照 |

## 快速启动

### 一键启动（推荐）

脚本会自动检测 JDK 21、PostgreSQL、数据库，无需手动配置环境。

**Mac / Linux / Windows Git Bash:**
```bash
bash start.sh
```

**Windows 双击运行:**
```
双击 start.bat
```

脚本会自动完成以下检测：
1. **JDK 21** - 搜索 JAVA_HOME、Homebrew、SDKMAN、常见安装路径
2. **PostgreSQL** - 自动搜索安装路径，检测端口 5432，未运行时自动启动
3. **数据库** - 检测 `layer_editor` 是否存在，不存在则自动创建
4. **建表** - Flyway 自动执行迁移脚本（已执行过的不重复执行）
5. **启动** - 后端(8080) + 前端(5173)

启动完成后浏览器自动打开 http://localhost:5173

### 手动启动

如果一键脚本遇到问题，可手动分步启动：

**前置条件：** JDK 21、PostgreSQL 运行中、`layer_editor` 数据库已创建

**前端:**
```bash
cd frontend
npm install    # 首次运行
npm run dev    # http://localhost:5173
```

**后端:**
```bash
cd backend
# Windows:
mvn spring-boot:run -Dspring-boot.run.profiles=windows
# Mac:
mvn spring-boot:run -Dspring-boot.run.profiles=mac
# http://localhost:8080
```

详细环境安装指南: [STARTUP_WINDOWS.md](STARTUP_WINDOWS.md) | [STARTUP_MAC.md](STARTUP_MAC.md)

### Docker 启动 PostgreSQL

```bash
# 在 .env 中设置 POSTGRES_PASSWORD，然后：
docker compose up -d
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SPRING_PROFILE` | Spring Profile（windows/mac） | `windows` |
| `APP_AUTH_USERNAME` | 认证用户名 | `editor` |
| `APP_AUTH_PASSWORD` | 认证密码 | `editor` |
| `VOLC_ACCESS_KEY` | 火山引擎 Access Key | *(空)* |
| `VOLC_SECRET_KEY` | 火山引擎 Secret Key | *(空)* |
| `VOLC_ENDPOINT` | 火山引擎 API 端点 | `https://visual.volcengineapi.com` |

未配置火山引擎凭证时，AI 功能按钮显示为禁用状态，不影响其他编辑功能。

## 认证

系统使用 HTTP Basic 认证：
- 默认用户名: `editor`
- 默认密码: `editor`

可通过环境变量 `APP_AUTH_USERNAME` 和 `APP_AUTH_PASSWORD` 配置。

## 架构设计

详细的架构设计文档请参考 [LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md](LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md)

核心设计原则：
- **前端**负责编辑体验和画布状态管理（Zustand slice 模式）
- **后端**负责文档持久化、素材管理、版本快照、AI 处理
- 文档内容整体保存在 `editor_document.content`（JSONB 字段）中
- 图层图片通过 `assetId` 引用 `editor_asset` 表
- 单人编辑，不做多人实时协作
- 前端通过 Vite 代理转发 `/api/*` 和 `/uploads/*` 到后端

## 相关文档

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构设计 |
| [STARTUP.md](STARTUP.md) | 通用启动指南 |
| [STARTUP_WINDOWS.md](STARTUP_WINDOWS.md) | Windows 环境安装指南 |
| [STARTUP_MAC.md](STARTUP_MAC.md) | Mac 环境安装指南 |
| [SVG_DATA_FLOW.md](SVG_DATA_FLOW.md) | SVG 数据流设计 |
| [docs/](docs/) | 技术专题文档（OpenFeign、Kong、限流等） |

## License

MIT License
