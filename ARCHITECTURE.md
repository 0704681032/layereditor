# Layer Editor - 架构与流程文档

> 在线海报/图层编辑器，类似 Canva 的单用户设计工具。
> 前端 React + Konva.js，后端 Spring Boot + PostgreSQL。

---

## 1. 项目概览

```
┌──────────────────────────────────────────────────────────────────┐
│                        Layer Editor                              │
│                                                                  │
│   ┌──────────────┐         ┌──────────────────────────────┐     │
│   │   浏览器前端   │  HTTP   │      Spring Boot 后端         │     │
│   │              │ ──────▶ │                              │     │
│   │  React 19    │  REST   │  JDK 21 / MyBatis / Flyway   │     │
│   │  Konva.js    │ ◀────── │  PostgreSQL 16               │     │
│   │  Ant Design  │  JSON   │  本地文件存储                   │     │
│   │  Zustand     │         │                              │     │
│   └──────────────┘         └──────────────────────────────┘     │
│                                                                  │
│   前端: localhost:5173 (Vite Dev)     后端: localhost:8080       │
└──────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端框架** | React | 19.2 | UI 渲染 |
| **画布引擎** | Konva.js + react-konva | 10.2 | 2D 图形渲染 |
| **UI 组件库** | Ant Design | 6.3 | 界面组件 |
| **状态管理** | Zustand | 5.0 | 编辑器状态 |
| **服务端状态** | TanStack React Query | 5.96 | 文档列表缓存 |
| **路由** | React Router DOM | 7.14 | SPA 路由 |
| **HTTP 客户端** | Axios | 1.15 | API 调用 |
| **不可变数据** | Immer | 11.1 | 撤销/重做 |
| **PDF 导出** | jsPDF | 4.2 | PDF 生成 |
| **SVG 安全** | DOMPurify | 3.3 | XSS 防护 |
| **构建工具** | Vite | 8.0 | 开发/打包 |
| | | | |
| **后端框架** | Spring Boot | 3.3.6 | REST API |
| **JDK** | OpenJDK | 21 | 运行时 |
| **ORM** | MyBatis | 3.0.4 | 数据库访问 |
| **数据库** | PostgreSQL | 16 | 数据存储 |
| **迁移工具** | Flyway | - | Schema 管理 |
| **安全** | Spring Security | - | HTTP Basic认证，CSRF禁用 |
| **工具** | Lombok | 1.18 | 代码简化 |

---

## 2. 目录结构

```
layereditor/
├── frontend/                          # 前端项目 (Vite + React + TypeScript)
│   ├── src/
│   │   ├── main.tsx                   # 应用入口
│   │   ├── App.tsx                    # 根组件（路由 + Provider）
│   │   ├── pages/                     # 页面级组件
│   │   │   ├── document-list/         #   文档列表页 (/)
│   │   │   └── editor/               #   编辑器页 (/editor/:id)
│   │   ├── features/editor/
│   │   │   ├── api/                   #   API 调用封装
│   │   │   │   ├── document.ts        #     文档 CRUD
│   │   │   │   ├── revision.ts        #     版本管理
│   │   │   │   └── asset.ts           #     资产上传
│   │   │   ├── components/
│   │   │   │   ├── canvas/            #   画布相关组件
│   │   │   │   │   ├── EditorStage.tsx       # Stage 主组件（缩放/拖拽/绘图）
│   │   │   │   │   ├── LayerRenderer.tsx     # 图层渲染器（9种类型）
│   │   │   │   │   ├── SelectionTransformer.tsx  # 选择变换框
│   │   │   │   │   ├── GridOverlay.tsx       # 网格叠加层
│   │   │   │   │   └── SmartGuides.tsx       # 智能参考线
│   │   │   │   ├── panel/             #   侧面板
│   │   │   │   │   ├── LayerTreePanel.tsx    # 图层树（左）
│   │   │   │   │   ├── PropertyPanel.tsx     # 属性面板（右）
│   │   │   │   │   └── HistoryPanel.tsx      # 版本历史
│   │   │   │   ├── picker/            #   选择器
│   │   │   │   │   ├── AssetPicker.tsx       # 素材库
│   │   │   │   │   └── SvgShapePicker.tsx    # SVG 形状
│   │   │   │   └── layout/
│   │   │   │       └── EditorLayout.tsx      # 编辑器主布局
│   │   │   ├── hooks/                 #   自定义 Hooks
│   │   │   │   ├── useAutoSave.ts            # 自动保存（3秒防抖）
│   │   │   │   ├── useExportImage.ts         # 多格式导出
│   │   │   │   ├── useKeyboardShortcuts.ts   # 快捷键
│   │   │   │   └── useGoogleFonts.ts         # Google Fonts 加载
│   │   │   ├── store/
│   │   │   │   └── editorStore.ts            # Zustand 全局状态
│   │   │   ├── types/                 #   TypeScript 类型定义
│   │   │   │   ├── layer.ts                  # 图层类型（9种）
│   │   │   │   ├── document.ts               # 文档类型
│   │   │   │   └── asset.ts                  # 资产类型
│   │   │   ├── utils/                 #   工具函数
│   │   │   │   ├── layerTreeOperations.ts    # 图层树增删改查
│   │   │   │   └── localImageImport.ts       # 本地图片导入
│   │   │   └── data/
│   │   │       └── presetShapes.ts           # SVG 预设形状数据
│   │   └── shared/
│   │       └── lib/api.ts             # Axios 实例 + 拦截器
│   ├── vite.config.ts                 # Vite 配置（代理/分包）
│   └── package.json
│
├── backend/                           # 后端项目 (Spring Boot + MyBatis)
│   ├── src/main/java/com/example/editor/
│   │   ├── EditorApplication.java            # 启动类
│   │   ├── common/
│   │   │   ├── response/ApiResponse.java     # 统一响应包装
│   │   │   └── exception/                    # 全局异常处理
│   │   ├── document/                         # 文档模块
│   │   │   ├── controller/DocumentController.java
│   │   │   ├── service/DocumentService.java
│   │   │   ├── entity/EditorDocument.java
│   │   │   └── mapper/DocumentMapper.java + .xml
│   │   ├── asset/                            # 资产模块
│   │   │   ├── controller/AssetController.java
│   │   │   ├── service/AssetService.java
│   │   │   ├── entity/EditorAsset.java
│   │   │   └── mapper/AssetMapper.java + .xml
│   │   ├── revision/                         # 版本模块
│   │   │   ├── controller/RevisionController.java
│   │   │   ├── service/RevisionService.java
│   │   │   ├── entity/EditorDocumentRevision.java
│   │   │   └── mapper/RevisionMapper.java + .xml
│   │   ├── common/security/SecurityConfig.java  # 安全配置（HTTP Basic认证）
│   │   └── common/util/SvgSanitizer.java        # SVG 安全清洗
│   ├── src/main/resources/
│   │   ├── application.yml                   # 应用配置
│   │   ├── db/migration/                     # Flyway 迁移
│   │   │   ├── V1__create_tables.sql
│   │   │   └── V2__insert_default_user.sql
│   │   └── mapper/                           # MyBatis XML
│   └── pom.xml
│
├── docker-compose.yml                 # PostgreSQL 容器
├── start.sh / start.bat               # 一键启动脚本
└── uploads/                           # 文件上传目录
```

---

## 3. 数据库设计

### ER 图

```
                    ┌─────────────────────┐
                    │      app_user       │
                    ├─────────────────────┤
                    │ id          PK, BIGSERIAL │
                    │ username    VARCHAR(64) UNIQUE │
                    │ password_hash VARCHAR(255) │
                    │ created_at  TIMESTAMPTZ │
                    └────────┬────────────┘
                             │ 1:N
              ┌──────────────┼──────────────────┐
              │              │                   │
              ▼              ▼                   ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│ editor_document  │  │  editor_asset    │  │ editor_document_revision │
├──────────────────┤  ├──────────────────┤  ├──────────────────────────┤
│ id          PK   │  │ id          PK   │  │ id                  PK   │
│ owner_id    FK   │  │ owner_id    FK   │  │ document_id         FK   │
│ title            │  │ document_id FK   │  │ version_no   UNIQUE(doc) │
│ status           │  │ kind             │  │ snapshot        JSONB    │
│ schema_version   │  │ filename         │  │ message                  │
│ current_version  │  │ mime_type        │  │ created_by       FK      │
│ content    JSONB │  │ bucket           │  │ created_at               │
│ cover_asset_id FK│  │ storage_key UNIQUE│  └──────────────────────────┘
│ created_at       │  │ file_size        │
│ updated_at       │  │ width / height   │
│ deleted_at       │  │ sha256           │
└──────────────────┘  │ created_at       │
                      │ deleted_at       │
                      └──────────────────┘
```

### 表结构详解

#### app_user — 用户表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | bigserial | PK | 用户 ID |
| username | varchar(64) | NOT NULL, UNIQUE | 用户名 |
| password_hash | varchar(255) | NOT NULL | BCrypt 密码哈希 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

#### editor_document — 文档表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | bigserial | PK | 文档 ID |
| owner_id | bigint | FK → app_user, NOT NULL | 所属用户 |
| title | varchar(200) | NOT NULL | 文档标题 |
| status | varchar(32) | DEFAULT 'draft' | 状态 (draft/published) |
| schema_version | int | DEFAULT 1 | 内容结构版本号 |
| current_version | int | DEFAULT 1 | 文档版本号，每次保存自增 |
| **content** | **jsonb** | NOT NULL | **核心：完整图层数据** |
| cover_asset_id | bigint | FK → editor_asset | 封面缩略图 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |
| updated_at | timestamptz | DEFAULT now() | 最后更新时间 |
| deleted_at | timestamptz | nullable | 软删除标记 |

**索引**: `idx_editor_document_owner_updated (owner_id, updated_at DESC)`

#### editor_asset — 资产（文件）表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | bigserial | PK | 资产 ID |
| owner_id | bigint | FK → app_user, NOT NULL | 所属用户 |
| document_id | bigint | FK → editor_document | 关联文档 |
| kind | varchar(32) | NOT NULL | 类型: image / svg |
| filename | varchar(255) | NOT NULL | 原始文件名 |
| mime_type | varchar(100) | NOT NULL | MIME 类型 |
| bucket | varchar(100) | NOT NULL | 存储桶: local |
| storage_key | varchar(500) | NOT NULL, UNIQUE | 存储路径: uploads/2026/04/xxx.png |
| file_size | bigint | NOT NULL | 文件大小 (bytes) |
| width / height | int | nullable | 图片尺寸 |
| sha256 | varchar(64) | nullable | 文件哈希校验 |
| created_at | timestamptz | DEFAULT now() | 上传时间 |
| deleted_at | timestamptz | nullable | 软删除 |

**索引**: `idx_editor_asset_document (document_id)`

#### editor_document_revision — 版本快照表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | bigserial | PK | 修订 ID |
| document_id | bigint | FK → editor_document, ON DELETE CASCADE | 所属文档 |
| version_no | int | NOT NULL | 版本号（自增） |
| **snapshot** | **jsonb** | NOT NULL | **完整文档内容快照** |
| message | varchar(255) | nullable | 版本备注 |
| created_by | bigint | FK → app_user | 创建人 |
| created_at | timestamptz | DEFAULT now() | 创建时间 |

**约束**: `UNIQUE(document_id, version_no)`

### content JSONB 数据结构

这是编辑器的核心数据，存储在 `editor_document.content` 字段中：

```json
{
  "schemaVersion": 1,
  "canvas": {
    "width": 1920,
    "height": 1080,
    "background": "#ffffff"
  },
  "viewport": {
    "zoom": 1.0,
    "offsetX": 0,
    "offsetY": 0
  },
  "layers": [
    {
      "id": "layer_abc123",
      "type": "rect",
      "name": "Background",
      "x": 0, "y": 0,
      "width": 1920, "height": 1080,
      "fill": "#ff0000",
      "stroke": "#000000",
      "strokeWidth": 2,
      "cornerRadius": 0,
      "opacity": 1,
      "rotation": 0,
      "visible": true,
      "locked": false
    },
    {
      "id": "layer_def456",
      "type": "text",
      "name": "Title",
      "x": 100, "y": 100,
      "text": "Hello World",
      "fontSize": 48,
      "fontFamily": "Arial",
      "fontWeight": 700,
      "fill": "#333333",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textTransform": "none",
      "textStroke": null,
      "textStrokeWidth": 0,
      "wrap": "none",
      "maxWidth": null
    },
    {
      "id": "layer_grp789",
      "type": "group",
      "name": "Group",
      "x": 50, "y": 50,
      "width": 400, "height": 300,
      "children": [
        { "...": "子图层" }
      ]
    }
  ],
  "thumbnail": "data:image/jpeg;base64,..."
}
```

### 9 种图层类型

| type | 特有字段 | 说明 |
|------|----------|------|
| `rect` | fill, stroke, strokeWidth, cornerRadius | 矩形 |
| `ellipse` | fill, stroke, strokeWidth | 椭圆 |
| `text` | text, fontSize, fontFamily, fontWeight, fontStyle, textDecoration, textTransform, textStroke, wrap, maxWidth | 文本 |
| `image` | src (asset URL), naturalWidth, naturalHeight | 图片 |
| `svg` | svgData (SVG 字符串) | SVG 矢量图形 |
| `line` | points[], stroke, strokeWidth | 线条 |
| `star` | numPoints, innerRadius, fill | 星形 |
| `polygon` | sides, fill | 多边形 |
| `group` | children: EditorLayer[] | 图层组（嵌套） |

**公共字段**: id, type, name, x, y, width, height, rotation, opacity, visible, locked, shadow, blendMode, filters

---

## 4. REST API 接口

### 统一响应格式

```json
{
  "code": 0,          // 0 = 成功, 非0 = 错误
  "message": "OK",
  "data": { ... }
}
```

### 文档管理 `/api/documents`

| 方法 | 端点 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| `POST` | `/api/documents` | 创建空白文档 | `{title, schemaVersion, content}` | DocumentDetailResponse |
| `POST` | `/api/documents/import-file` | 从文件导入创建 | FormData: file + title | DocumentDetailResponse |
| `GET` | `/api/documents` | 列出当前用户所有文档 | - | List\<DocumentListItemResponse\> |
| `GET` | `/api/documents/{id}` | 获取文档详情 | - | DocumentDetailResponse |
| `PUT` | `/api/documents/{id}` | 更新文档（自动保存） | `{title, schemaVersion, currentVersion, content}` | DocumentUpdateResponse |
| `PATCH` | `/api/documents/{id}/title` | 仅修改标题 | `{title}` | void |
| `DELETE` | `/api/documents/{id}` | 删除文档（软删除） | - | void |

### 资产管理 `/api/assets`

| 方法 | 端点 | 说明 | 参数 |
|------|------|------|------|
| `POST` | `/api/assets` | 上传文件 | FormData: file, documentId?, kind? |
| `GET` | `/api/assets` | 列出资产 | query: documentId?, kind?, page?, size? |
| `GET` | `/api/assets/{id}` | 获取资产详情 | - |

### 版本管理 `/api/documents/{documentId}/revisions`

| 方法 | 端点 | 说明 | 请求体 |
|------|------|------|--------|
| `POST` | `/revisions` | 创建版本快照 | `{message?}` |
| `GET` | `/revisions` | 列出所有版本 | - |
| `GET` | `/revisions/{revisionId}` | 获取版本详情（含快照） | - |
| `POST` | `/revisions/{versionNo}/restore` | 恢复到指定版本 | - |

### Vite 代理配置

前端开发时，Vite 将 `/api` 请求代理到后端 `localhost:8080`：

```
浏览器 → localhost:5173/api/* → Vite Proxy → localhost:8080/api/*
```

---

## 5. 核心交互流程

### 5.1 编辑器主界面布局

```
┌──────────────────────────────────────────────────────────────────┐
│  [Home] 文档标题 · 尺寸    [工具栏...]    [缩放] [网格] [保存] [导出] │  ← 顶部工具栏 (44px)
├────────────┬───────────────────────────────┬─────────────────────┤
│            │                               │                     │
│  图层面板   │         Konva 画布              │     属性面板         │
│  (250px)   │                               │     (280px)         │
│            │   ┌─────────────────────┐     │                     │
│  · 图层树   │   │   白色画布区域        │     │  · 位置/尺寸        │
│  · 排序     │   │   (1920 x 1080)     │     │  · 填充/描边        │
│  · 可见性   │   │                     │     │  · 透明度/旋转      │
│  · 锁定     │   │   图层渲染在这里      │     │  · 文字属性         │
│            │   │                     │     │  · 阴影/滤镜        │
│            │   └─────────────────────┘     │                     │
│            │                               │                     │
├────────────┴───────────────────────────────┴─────────────────────┤
│  53 layers · 1920 x 1080 · Zoom: 100% · ✓ Saved                │  ← 状态栏 (26px)
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 文档打开流程

```
用户点击文档卡片
    │
    ▼
navigate('/editor/:id')
    │
    ▼
EditorPage 组件挂载
    │
    ├─▶ getDocument(id) ──▶ GET /api/documents/{id}
    │                                    │
    │                                    ▼
    │                          返回 {content: jsonb, title, ...}
    │                                    │
    ▼                                    ▼
editorStore.setDocument(doc)    ◀───  初始化 store
    │
    ├─▶ content = doc.content (图层数据)
    ├─▶ title = doc.title
    ├─▶ currentVersion = doc.currentVersion
    ├─▶ isDirty = false
    │
    ▼
EditorStage 渲染画布
    │
    ├─▶ content.layers.map(layer => <LayerRenderer layer={layer} />)
    ├─▶ <SelectionTransformer />  (选择框)
    ├─▶ <GridOverlay />  (网格)
    └─▶ <SmartGuides />  (参考线)
```

### 5.3 图层编辑流程

```
用户拖拽图层
    │
    ▼
Konva dragEnd 事件
    │
    ▼
store.updateLayerPatch(layerId, {x, y})
    │
    ├─▶ 递归查找图层 → updateLayerInTree(layers, id, patch)
    ├─▶ markDirty() → isDirty = true
    │
    ▼
useAutoSave Hook 检测到 isDirty 变化
    │
    ├─▶ 启动 3 秒防抖定时器
    │   │
    │   │  ... 3 秒内无新修改 ...
    │   │
    │   ▼
    ├─▶ 生成缩略图 (canvas → toDataURL → 200x200 JPEG)
    │
    ├─▶ PUT /api/documents/{id}  ──────▶  后端更新
    │    {                                     │
    │      title,                              ▼
    │      schemaVersion,               更新 content jsonb
    │      currentVersion,              current_version++
    │      content: {                    updated_at = now()
    │        ...layers,                       │
    │        thumbnail: "data:..."            ▼
    │      }                            返回 {currentVersion, updatedAt}
    │    }                                      │
    │                                          ▼
    ├─◀────────────────────────────  markSaved(newVersion)
    │
    ▼
isDirty = false, 状态栏显示 "✓ Saved"
```

### 5.4 撤销/重做流程

```
编辑器使用 Immer patches 实现，内存高效

    ┌─────────────────────────────────────────────┐
    │                History Stack                 │
    │                                             │
    │  [Entry 0] ← [Entry 1] ← ... ← [Entry 49]  │
    │     ↑                         ↑             │
    │   最旧的                    最新的           │
    │                     (最多 50 步)             │
    └─────────────────────────────────────────────┘

每次修改:
  1. 用 Immer produceWithPatches 生成 patches
  2. 将 {content, selectedLayerIds} 压入历史栈
  3. 更新 canUndo / canRedo 状态

撤销 (Ctrl+Z):
  undo() → 弹出栈顶 → 恢复上一个 entry 的 content
  → store.updateContent(entry.content)
  → store.selectLayers(entry.selectedLayerIds)

重做 (Ctrl+Shift+Z):
  redo() → 前进到下一个 entry → 恢复 content + selection
```

### 5.5 导出流程

```
用户点击 Export 按钮
    │
    ▼
ExportDialog 弹出
    │
    ├─ 选择模式: Full Canvas / Selected Layers / All Layers Separately
    ├─ 选择格式: PNG / JPEG / WebP / PDF / SVG
    ├─ 选择分辨率: 1x / 2x / 3x / 4x
    ├─ 裁剪选项: Crop to content (默认勾选)
    │
    ▼ 点击 Export
    │
    ├─▶ 隐藏 Transformer
    ├─▶ 保存并重置 Stage 状态 (scale=1, pos=0, size=canvas)
    ├─▶ 如果 cropToContent: calculateContentBounds() 计算内容边界
    │
    ├─▶ stage.toDataURL({x, y, width, height, pixelRatio})
    │       │
    │       ├── PNG/JPEG/WebP: 直接用 Konva toDataURL
    │       ├── PDF: toDataURL → jsPDF.addImage → pdf.save
    │       └── SVG: buildSVGFromLayers() 手动构建 SVG XML
    │
    ├─▶ fetch(dataURL) → Blob
    ├─▶ downloadBlob(blob, filename)  ← 延迟 5s 撤销 URL
    │
    └─▶ 恢复 Stage 原始状态 (scale, position, size)
```

### 5.6 版本管理流程

```
                    ┌────────────────────────────────────────┐
                    │           Version History Panel        │
                    │                                        │
  用户点击 ──▶ [Save Version] ──▶ 输入备注 ──▶ [Save]       │
                    │                    │                   │
                    │                    ▼                   │
                    │        POST /documents/{id}/revisions  │
                    │        { message: "版本备注" }          │
                    │                    │                   │
                    │                    ▼                   │
                    │     后端: snapshot = 当前 content       │
                    │     version_no = MAX(version_no) + 1   │
                    │                    │                   │
                    │                    ▼                   │
                    │     刷新版本列表                        │
                    │                                        │
                    │  v23  Third version         [Restore]  │
                    │  v22  Second snapshot       [Restore]  │
                    │  v21  Initial version       [Restore]  │
                    │                                        │
                    │  点击 [Restore] ──▶ 确认弹窗            │
                    │                    │                   │
                    │                    ▼                   │
                    │  POST /revisions/{versionNo}/restore   │
                    │                    │                   │
                    │                    ▼                   │
                    │     后端: 复制 snapshot → document.content │
                    │                    │                   │
                    │                    ▼                   │
                    │     前端: getDocument(id) → updateContent │
                    │     编辑器画布刷新为恢复的内容             │
                    └────────────────────────────────────────┘
```

---

## 6. 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Z` | 撤销 |
| `Ctrl+Shift+Z` / `Ctrl+Y` | 重做 |
| `Delete` / `Backspace` | 删除选中图层 |
| `Ctrl+C` | 复制 |
| `Ctrl+X` | 剪切 |
| `Ctrl+V` | 粘贴 |
| `Ctrl+D` | 复制图层 |
| `Ctrl+A` | 全选 |
| `Ctrl+G` | 编组 |
| `Ctrl+Shift+G` | 取消编组 |
| `Ctrl+S` | 保存 |
| `Ctrl+0` | 缩放 100% |
| `Ctrl+1` | 适合屏幕 |
| `Ctrl++` | 放大 |
| `Ctrl+-` | 缩小 |
| `R` | 矩形绘图模式 |
| `O` | 椭圆绘图模式 |
| `L` | 线条绘图模式 |
| `Escape` | 取消绘图/取消选择 |
| `方向键` | 微移 1px |
| `Shift+方向键` | 移动 10px |

---

## 7. 安全设计

### SVG 安全清洗（双层防护）

```
用户上传 SVG 文件
        │
        ▼
┌──── 前端 (DOMPurify) ────┐
│  · 清除 <script>, onclick │
│  · 移除危险属性            │
│  · 防止 XSS 注入          │
└────────────┬──────────────┘
             │
             ▼
┌──── 后端 (SvgSanitizer) ──┐
│  · 移除 script/iframe/object│
│  · 清除事件处理器属性        │
│  · 防止 XXE 攻击            │
│  · 验证 xlink:href          │
│  · 大小限制: 单层 2MB        │
└────────────────────────────┘
```

### 内容校验 (ContentValidator)

| 校验项 | 限制 |
|--------|------|
| 文档内容总大小 | 10MB |
| 单层 SVG 大小 | 2MB |
| 最大图层数 | 500 |
| 文本最大长度 | 50,000 字符 |
| 上传文件大小 | 50MB |

### 当前安全状态

> **注意**: 当前为开发环境配置，Spring Security 放行所有请求，CSRF 已禁用。
> 生产部署前需要：
> - 启用认证/授权
> - 启用 CSRF 保护
> - 配置 CORS 白名单

---

## 8. 部署架构

### 开发环境

```
┌─────────────────────────────────────┐
│           开发者电脑                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Docker: PostgreSQL 16      │   │
│  │  localhost:5432             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Spring Boot (JDK 21)       │   │
│  │  localhost:8080              │   │
│  │  MyBatis → PostgreSQL       │   │
│  │  文件存储: ./uploads/        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Vite Dev Server            │   │
│  │  localhost:5173              │   │
│  │  Proxy /api → :8080         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 启动步骤

```bash
# 1. 启动 PostgreSQL
docker-compose up -d

# 2. 启动后端
cd backend
mvn spring-boot:run

# 3. 启动前端
cd frontend
npm install
npm run dev
```

### 生产部署（建议）

```
┌──────────────────────────────────────────┐
│              Nginx 反向代理                │
│              localhost:80                  │
│                                          │
│   /           → 静态文件 (dist/)          │
│   /api/*     → proxy_pass :8080          │
│   /uploads/* → proxy_pass :8080          │
├──────────────────────────────────────────┤
│  Spring Boot JAR (JDK 21)                │
│  PostgreSQL 16                            │
│  文件存储: /data/uploads 或 OSS           │
└──────────────────────────────────────────┘
```

---

## 9. 前端构建优化

Vite 配置了代码分割，将大型依赖拆分为独立 chunk：

```javascript
// vite.config.ts - manualChunks
{
  konva: ['konva'],           // ~400KB  画布引擎
  antd: ['antd'],             // ~1MB    UI 组件库
  vendor: ['react', 'react-dom', 'react-router-dom']  // React 核心
}
```

生产构建输出结构：
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js        # 应用代码
│   ├── konva-[hash].js        # Konva 引擎 (懒加载)
│   ├── antd-[hash].js         # Ant Design (懒加载)
│   ├── vendor-[hash].js       # React 核心
│   └── *.css                  # 样式文件
```

---

## 10. 后端 API 分层架构

```
┌─────────────────────────────────────────────────┐
│                  Controller 层                    │
│  · 接收 HTTP 请求                                 │
│  · 参数校验 (@Valid)                              │
│  · 统一响应包装 (ApiResponse<T>)                  │
│  · DocumentController / AssetController /        │
│    RevisionController                             │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                   Service 层                      │
│  · 业务逻辑处理                                   │
│  · 内容校验 (ContentValidator)                    │
│  · SVG 清洗 (SvgSanitizer)                       │
│  · 文件存储管理                                   │
│  · 版本号自增逻辑                                 │
│  · DocumentService / AssetService /              │
│    RevisionService                                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                  Mapper 层 (MyBatis)              │
│  · SQL 映射 (XML)                                │
│  · 对象关系映射                                   │
│  · DocumentMapper.xml / AssetMapper.xml /        │
│    RevisionMapper.xml                             │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL 16                        │
│  · JSONB 存储文档内容                             │
│  · 外键约束 + 软删除                              │
│  · Flyway 管理数据库迁移                          │
└─────────────────────────────────────────────────┘
```
