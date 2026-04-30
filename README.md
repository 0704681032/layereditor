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
- Vite 构建工具
- react-konva 画布渲染
- Zustand 状态管理
- TanStack Query 数据请求
- Ant Design UI组件

### 后端
- Spring Boot 3.3.6
- Spring Security (HTTP Basic Auth)
- MyBatis 数据访问
- OpenFeign + HttpClient5 (AI API调用)
- Flyway 数据库迁移
- PostgreSQL 数据库

### 安全特性
- HTTP Basic 认证
- CORS 多端口支持（5173-5179, 3000）
- SSRF防护（禁止私有网络URL）
- 文件上传类型校验
- SVG Sanitizer (XSS防护)
- SQL注入防护

## 项目结构

```
layereditor/
├── backend/                          # Spring Boot 后端
│   ├── src/main/java/com/example/editor/
│   │   ├── ai/                       # AI图像处理模块
│   │   │   ├── client/               # OpenFeign客户端
│   │   │   ├── config/               # 火山引擎配置
│   │   │   ├── controller/           # AI API控制器
│   │   │   ├── dto/                  # 数据传输对象
│   │   │   └── service/              # AI服务层
│   │   ├── asset/                    # 素材管理模块
│   │   ├── document/                 # 文档管理模块
│   │   ├── revision/                 # 版本历史模块
│   │   └── common/
│   │       ├── config/               # 全局配置（连接池、安全）
│   │       ├── exception/            # 异常处理
│   │       ├── response/             # 统一响应格式
│   │       └── security/             # Spring Security配置
│   └── src/main/resources/
│       ├── application.yml           # 主配置文件
│       ├── application-mac.yml       # Mac环境配置
│       ├── application-windows.yml   # Windows环境配置
│       └── db/migration/             # Flyway迁移脚本
│
├── frontend/                         # React 前端
│   └ src/
│   │   ├── app/                      # 应用入口
│   │   ├── pages/                    # 页面组件
│   │   │   ├── document-list/        # 文档列表页
│   │   │   └── editor/               # 编辑器页面
│   │   ├── features/editor/
│   │   │   ├── api/                  # API客户端
│   │   │   │   ├── aiImage.ts        # AI图像API
│   │   │   │   ├── document.ts       # 文档API
│   │   │   │   ├── asset.ts          # 素材API
│   │   │   │   └── revision.ts       # 版本API
│   │   │   ├── components/
│   │   │   │   ├── canvas/           # 画布组件
│   │   │   │   ├── panel/            # 属性面板、图层树
│   │   │   │   ├── layout/           # 编辑器布局
│   │   │   │   └── picker/           # 素材选择器
│   │   │   ├── store/                # Zustand状态管理
│   │   │   └── types/                # TypeScript类型定义
│   │   └── shared/                   # 共享组件
│   └ package.json
│   └ vite.config.ts
│   └ tsconfig.json
│
├── STARTUP.md                        # 启动指南
├── LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md  # 架构设计文档
└── README.md                         # 本文档
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

## 配置说明

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SPRING_PROFILE` | Spring Profile | `windows` |
| `APP_AUTH_USERNAME` | 认证用户名 | `editor` |
| `APP_AUTH_PASSWORD` | 认证密码 | `editor` |
| `VOLC_ACCESS_KEY` | 火山引擎 Access Key | - |
| `VOLC_SECRET_KEY` | 火山引擎 Secret Key | - |
| `VOLC_ENDPOINT` | 火山引擎 API端点 | `https://visual.volcengineapi.com` |

### 数据库配置

支持多环境配置，通过 `SPRING_PROFILE` 切换：

- `application-mac.yml` - Mac环境（本地PostgreSQL）
- `application-windows.yml` - Windows环境

### 连接池配置

数据库连接池（HikariCP）：
```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

HTTP连接池（HttpClient5）：
```yaml
feign:
  httpclient:
    max-connections: 200
    max-connections-per-route: 50
    connection-timeout: 5000
    socket-timeout: 60000
```

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

> **首次克隆项目后**只需一条命令 `bash start.sh` 即可完成所有环境检测和服务启动。

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

## 认证

系统使用 HTTP Basic 认证：

- 默认用户名: `editor`
- 默认密码: `editor`

可通过环境变量 `APP_AUTH_USERNAME` 和 `APP_AUTH_PASSWORD` 配置。

## AI 功能配置

AI功能需要配置火山引擎API凭证：

1. 注册火山引擎账号
2. 开通视觉智能服务
3. 获取 Access Key 和 Secret Key
4. 设置环境变量：

```bash
export VOLC_ACCESS_KEY=your_access_key
export VOLC_SECRET_KEY=your_secret_key
```

未配置凭证时，AI功能按钮显示为禁用状态，不影响其他编辑功能。

## 架构设计

详细的架构设计文档请参考 [LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md](LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md)

核心设计原则：
- 前端负责编辑体验和图层状态管理
- 后端负责文档保存、素材管理、版本快照、AI处理
- 文档整体保存在 `editor_document.content(jsonb)` 中
- 图层图片通过 `assetId` 引用 `editor_asset`
- 单人编辑，不做多人实时协作

## 开发指南

### 代码规范

- 后端使用 Spring Boot + MyBatis 标准分层
- 配置使用 `@ConfigurationProperties` 集中管理
- 前端使用 Zustand 管理编辑器状态
- TypeScript 类型定义集中在 `types/` 目录

### 新增功能

1. 后端：在对应模块的 `controller/service/mapper` 添加代码
2. 前端：在 `features/editor/api/` 添加API客户端
3. 组件：在 `features/editor/components/` 添加UI组件
4. 状态：在 `features/editor/store/` 更新状态管理

### 安全注意事项

- 禁止直接拼接SQL，使用MyBatis参数绑定
- 文件上传需校验类型和大小
- URL参数需做SSRF防护
- SVG解析需做XSS过滤

## 版本历史

| 版本 | 主要更新 |
|------|----------|
| v0.3 | AI图像处理集成（抠图、扩图、消除、超分辨率） |
| v0.2 | SVG/Sketch导入解析、安全性加固 |
| v0.1 | 基础图层编辑功能 |

## License

MIT License