# 单人版图层编辑器架构设计

## 适用范围

这份文档面向下面这类项目：

- 前端需要支持图层编辑、拖拽、缩放、旋转、分组、排序
- 后端只需要支持单人编辑，不做多人实时协作
- 数据库存储使用 PostgreSQL
- 后端技术栈使用 Spring Boot
- 前端技术栈使用 React

这份方案刻意保持“先能用、后扩展”的节奏：

- 图层结构先整体存成 `jsonb`
- 素材单独建 `asset` 表
- 历史版本先用全量快照
- 不在 MVP 阶段把图层拆成独立表
- 不在 MVP 阶段引入 WebSocket、OT、CRDT

## 先讲结论

推荐的最小可用方案如下：

- 前端：`React + TypeScript + Vite + react-konva + Zustand + TanStack Query`
- 后端：`Spring Boot + Spring Security + MyBatis`
- 数据库：`PostgreSQL`
- 文件存储：`MinIO` 或兼容 S3 的对象存储

核心设计原则：

- 前端负责编辑体验和图层状态管理
- 后端负责文档保存、素材管理、版本快照、权限控制
- 文档整体保存在 `editor_document.content(jsonb)` 中
- 图层里的图片、字体等资源通过 `assetId` 引用 `editor_asset`

---

## 1. 技术选型方案

## 前端编辑器选型

推荐使用：

- `React`
- `TypeScript`
- `Vite`
- `react-konva`
- `Zustand`
- `TanStack Query`
- `Ant Design` 或 `Arco Design`

推荐 `react-konva` 的原因：

- Konva 天然支持 `Stage / Layer / Group / Shape`
- 适合实现图层树、分组、多选、拖拽、缩放、旋转
- 自带 `Transformer`，做选中框、缩放控制点更方便
- 在 React 中集成成本低于直接操作原生 Canvas

前端职责建议如下：

- 维护编辑器中的文档状态
- 维护当前选中图层、图层树、属性面板
- 负责自动保存触发
- 上传素材后，把后端返回的 `assetId` 写回图层 JSON

## 后端技术选型

推荐使用：

- `Spring Boot`
- `Spring Web`
- `Spring Validation`
- `Spring Security`
- `MyBatis`
- `Flyway`
- `PostgreSQL`
- `MinIO`

推荐 `MyBatis` 的原因：

- `jsonb` 字段读写清晰
- SQL 可控，适合乐观锁和版本校验
- 比较适合文档类系统的 CRUD 和查询

---

## 2. 核心表设计

## 表清单

建议先保留 4 张核心表：

- `app_user`
- `editor_document`
- `editor_asset`
- `editor_document_revision`

## 建表 SQL

```sql
create table app_user (
  id               bigserial primary key,
  username         varchar(64) not null unique,
  password_hash    varchar(255) not null,
  created_at       timestamptz not null default now()
);

create table editor_document (
  id               bigserial primary key,
  owner_id         bigint not null references app_user(id),
  title            varchar(200) not null,
  status           varchar(32) not null default 'draft',
  schema_version   int not null default 1,
  current_version  int not null default 1,
  content          jsonb not null,
  cover_asset_id   bigint,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index idx_editor_document_owner_updated
  on editor_document(owner_id, updated_at desc);

create table editor_asset (
  id               bigserial primary key,
  owner_id         bigint not null references app_user(id),
  document_id      bigint references editor_document(id),
  kind             varchar(32) not null,
  filename         varchar(255) not null,
  mime_type        varchar(100) not null,
  bucket           varchar(100) not null,
  storage_key      varchar(500) not null unique,
  file_size        bigint not null,
  width            int,
  height           int,
  sha256           varchar(64),
  created_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index idx_editor_asset_document
  on editor_asset(document_id);

create table editor_document_revision (
  id               bigserial primary key,
  document_id      bigint not null references editor_document(id) on delete cascade,
  version_no       int not null,
  snapshot         jsonb not null,
  message          varchar(255),
  created_by       bigint references app_user(id),
  created_at       timestamptz not null default now(),
  unique(document_id, version_no)
);

alter table editor_document
  add constraint fk_editor_document_cover_asset
  foreign key (cover_asset_id) references editor_asset(id);
```

## 各表职责

### `editor_document`

存整份设计稿文档，包含：

- 画布尺寸
- 图层树
- 图层属性
- 分组关系
- 当前 schema 版本

推荐把完整文档放到 `content jsonb`，不要在初期拆成 `layer` 表。

### `editor_asset`

存素材元数据，包含：

- 图片、字体、视频、文件
- 文件名
- MIME 类型
- 存储桶
- 存储 key
- 尺寸和大小

图层中只引用 `assetId`，不要直接塞物理路径。

### `editor_document_revision`

存历史快照，解决：

- 手动保存
- 关键节点留档
- 回滚
- 故障恢复

单人版先存全量快照，最稳妥。

---

## 3. 文档 JSON 结构设计

建议定义自己的业务协议，不直接存 Konva 内部结构。

```json
{
  "schemaVersion": 1,
  "canvas": {
    "width": 1200,
    "height": 800,
    "background": "#FFF8EF"
  },
  "viewport": {
    "zoom": 1,
    "offsetX": 0,
    "offsetY": 0
  },
  "layers": [
    {
      "id": "layer_bg",
      "type": "rect",
      "name": "Background",
      "x": 0,
      "y": 0,
      "width": 1200,
      "height": 800,
      "fill": "#FFF8EF",
      "visible": true,
      "locked": true
    },
    {
      "id": "group_hero",
      "type": "group",
      "name": "Hero",
      "x": 120,
      "y": 80,
      "rotation": 0,
      "visible": true,
      "children": [
        {
          "id": "text_1",
          "type": "text",
          "name": "Title",
          "x": 0,
          "y": 0,
          "text": "Hello Editor",
          "fontFamily": "Inter",
          "fontSize": 48,
          "fill": "#1F2937"
        },
        {
          "id": "img_1",
          "type": "image",
          "name": "Banner",
          "x": 0,
          "y": 80,
          "width": 320,
          "height": 180,
          "assetId": 2001,
          "visible": true
        }
      ]
    }
  ],
  "selection": [],
  "guides": [],
  "meta": {
    "editorVersion": "0.1.0"
  }
}
```

---

## 4. Spring Boot 后端分层设计

这一部分对应：

1. `Controller`
2. `DTO`
3. `Service`
4. `Mapper`

## 推荐包结构

```text
com.example.editor
├── common
│   ├── config
│   ├── exception
│   ├── response
│   └── security
├── document
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── mapper
│   └── service
├── asset
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── mapper
│   └── service
└── revision
    ├── controller
    ├── dto
    ├── entity
    ├── mapper
    └── service
```

## Controller 设计

### `DocumentController`

职责：

- 创建文档
- 查询文档详情
- 更新文档
- 查询文档列表

建议接口：

```text
POST   /api/documents
GET    /api/documents/{id}
GET    /api/documents
PUT    /api/documents/{id}
```

### `AssetController`

职责：

- 上传素材
- 查询素材信息

建议接口：

```text
POST   /api/assets
GET    /api/assets/{id}
```

### `RevisionController`

职责：

- 手动创建版本
- 查询历史版本

建议接口：

```text
POST   /api/documents/{id}/revisions
GET    /api/documents/{id}/revisions
GET    /api/documents/{id}/revisions/{revisionId}
```

## DTO 设计

### 创建文档

```java
public record CreateDocumentRequest(
    @NotBlank String title,
    @NotNull Integer schemaVersion,
    @NotBlank String content
) {}
```

### 更新文档

```java
public record UpdateDocumentRequest(
    @NotBlank String title,
    @NotNull Integer schemaVersion,
    @NotNull Integer currentVersion,
    @NotBlank String content
) {}
```

### 创建版本

```java
public record CreateRevisionRequest(
    String message
) {}
```

### 素材上传响应

```java
public record AssetResponse(
    Long id,
    String filename,
    String mimeType,
    Long fileSize,
    Integer width,
    Integer height,
    String url
) {}
```

说明：

- 为了简化实现，`content` 可先作为字符串接收，再在 Service 层校验 JSON
- 如果团队已经统一接 `JsonNode`，也可以把 `content` 定义成 `JsonNode`

## Entity 设计

### `EditorDocument`

```java
public class EditorDocument {
  private Long id;
  private Long ownerId;
  private String title;
  private String status;
  private Integer schemaVersion;
  private Integer currentVersion;
  private String content;
  private Long coverAssetId;
  private OffsetDateTime createdAt;
  private OffsetDateTime updatedAt;
  private OffsetDateTime deletedAt;
}
```

### `EditorAsset`

```java
public class EditorAsset {
  private Long id;
  private Long ownerId;
  private Long documentId;
  private String kind;
  private String filename;
  private String mimeType;
  private String bucket;
  private String storageKey;
  private Long fileSize;
  private Integer width;
  private Integer height;
  private String sha256;
  private OffsetDateTime createdAt;
  private OffsetDateTime deletedAt;
}
```

## Service 设计

### `DocumentService`

核心职责：

- 创建默认文档
- 查询文档
- 更新文档
- 做版本冲突校验
- 生成快照

关键逻辑：

- `PUT /api/documents/{id}` 时，前端必须带 `currentVersion`
- 后端更新时用乐观锁
- 更新成功后版本号自增

伪代码如下：

```java
public DocumentDetailResponse update(Long id, Long userId, UpdateDocumentRequest request) {
    EditorDocument current = documentMapper.selectByIdForOwner(id, userId);
    if (current == null) {
        throw new NotFoundException("document not found");
    }
    if (!current.getCurrentVersion().equals(request.currentVersion())) {
        throw new ConflictException("document version conflict");
    }

    int updated = documentMapper.updateDocument(
        id,
        userId,
        request.title(),
        request.schemaVersion(),
        request.content(),
        request.currentVersion()
    );
    if (updated == 0) {
        throw new ConflictException("document version conflict");
    }
    return getDetail(id, userId);
}
```

### `AssetService`

核心职责：

- 上传文件到 MinIO
- 提取图片宽高
- 计算哈希
- 保存素材元数据

### `RevisionService`

核心职责：

- 按当前文档生成快照
- 查询历史版本
- 查询某个版本详情

## Mapper 设计

### `DocumentMapper`

```java
public interface DocumentMapper {
  EditorDocument selectByIdForOwner(@Param("id") Long id, @Param("ownerId") Long ownerId);
  List<EditorDocument> selectPageByOwner(@Param("ownerId") Long ownerId);
  int insert(EditorDocument document);
  int updateDocument(
      @Param("id") Long id,
      @Param("ownerId") Long ownerId,
      @Param("title") String title,
      @Param("schemaVersion") Integer schemaVersion,
      @Param("content") String content,
      @Param("currentVersion") Integer currentVersion
  );
}
```

### 乐观锁 SQL 示例

```sql
update editor_document
set
  title = #{title},
  schema_version = #{schemaVersion},
  content = cast(#{content} as jsonb),
  current_version = current_version + 1,
  updated_at = now()
where id = #{id}
  and owner_id = #{ownerId}
  and current_version = #{currentVersion}
  and deleted_at is null
```

当返回值为 `0` 时，就说明版本冲突。

---

## 5. 前端编辑器目录结构设计

这一部分对应：

2. 前端编辑器目录结构
3. Zustand store 设计

## 推荐目录结构

```text
src
├── app
│   ├── router.tsx
│   └── providers.tsx
├── pages
│   ├── document-list
│   │   └── index.tsx
│   └── editor
│       └── index.tsx
├── features
│   └── editor
│       ├── api
│       │   ├── document.ts
│       │   ├── asset.ts
│       │   └── revision.ts
│       ├── components
│       │   ├── canvas
│       │   │   ├── EditorStage.tsx
│       │   │   ├── LayerRenderer.tsx
│       │   │   ├── SelectionTransformer.tsx
│       │   │   └── GuidesOverlay.tsx
│       │   ├── panel
│       │   │   ├── LayerTreePanel.tsx
│       │   │   ├── PropertyPanel.tsx
│       │   │   └── Toolbar.tsx
│       │   └── layout
│       │       └── EditorLayout.tsx
│       ├── hooks
│       │   ├── useAutoSave.ts
│       │   ├── useImageAsset.ts
│       │   └── useSelection.ts
│       ├── store
│       │   ├── editorStore.ts
│       │   ├── selectors.ts
│       │   └── history.ts
│       ├── types
│       │   ├── document.ts
│       │   ├── layer.ts
│       │   └── asset.ts
│       └── utils
│           ├── layerTree.ts
│           ├── geometry.ts
│           └── serialize.ts
└── shared
    ├── components
    ├── lib
    └── types
```

## 组件职责

### `EditorStage.tsx`

负责：

- 渲染 Konva `Stage`
- 绑定缩放和平移
- 承载图层渲染

### `LayerRenderer.tsx`

负责：

- 根据文档协议递归渲染图层
- `rect / text / image / group` 分发到不同组件

### `SelectionTransformer.tsx`

负责：

- 对选中节点显示控制框
- 支持缩放、旋转、拖拽

### `LayerTreePanel.tsx`

负责：

- 显示图层树
- 切换显隐
- 锁定
- 排序
- 选中图层

### `PropertyPanel.tsx`

负责：

- 编辑位置、尺寸、透明度、颜色、文本等属性

## Zustand Store 设计

推荐拆成下面这些状态：

- 文档状态
- 选中状态
- 视口状态
- 脏数据状态
- 本地历史状态

## Store 示例

```ts
type EditorState = {
  documentId: number | null;
  currentVersion: number;
  content: EditorDocumentContent | null;
  selectedLayerIds: string[];
  isDirty: boolean;
  zoom: number;
  offsetX: number;
  offsetY: number;

  setDocument: (payload: {
    documentId: number;
    currentVersion: number;
    content: EditorDocumentContent;
  }) => void;

  selectLayers: (layerIds: string[]) => void;
  updateLayerPatch: (layerId: string, patch: Partial<EditorLayer>) => void;
  moveLayer: (layerId: string, parentId: string | null, index: number) => void;
  toggleLayerVisible: (layerId: string) => void;
  toggleLayerLocked: (layerId: string) => void;
  setViewport: (zoom: number, offsetX: number, offsetY: number) => void;
  markSaved: (nextVersion: number) => void;
};
```

## Store 设计建议

- `content` 存完整文档协议
- UI 层不要直接把 Konva 节点实例放进 store
- 选中节点只存 `selectedLayerIds`
- `isDirty` 用于自动保存和离开页面提示
- `markSaved(nextVersion)` 用于保存成功后更新版本号

## 自动保存建议

推荐机制：

- 图层变更后标记 `isDirty = true`
- 使用 `useAutoSave` 监听脏状态
- 用户停止操作 2 到 5 秒后提交一次保存
- 保存成功后清理脏标记并刷新 `currentVersion`

---

## 6. API 合同设计与 JSON 示例

这一部分对应：

3. 完整接口定义 JSON 示例

## 统一响应结构

```json
{
  "code": 0,
  "message": "OK",
  "data": {}
}
```

## 6.1 创建文档

### 请求

`POST /api/documents`

```json
{
  "title": "首页 Banner",
  "schemaVersion": 1,
  "content": {
    "schemaVersion": 1,
    "canvas": {
      "width": 1200,
      "height": 800,
      "background": "#FFF8EF"
    },
    "layers": []
  }
}
```

### 响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 101,
    "title": "首页 Banner",
    "schemaVersion": 1,
    "currentVersion": 1,
    "content": {
      "schemaVersion": 1,
      "canvas": {
        "width": 1200,
        "height": 800,
        "background": "#FFF8EF"
      },
      "layers": []
    },
    "createdAt": "2026-04-09T10:00:00+08:00",
    "updatedAt": "2026-04-09T10:00:00+08:00"
  }
}
```

## 6.2 查询文档详情

### 请求

`GET /api/documents/101`

### 响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 101,
    "title": "首页 Banner",
    "schemaVersion": 1,
    "currentVersion": 7,
    "content": {
      "schemaVersion": 1,
      "canvas": {
        "width": 1200,
        "height": 800,
        "background": "#FFF8EF"
      },
      "layers": [
        {
          "id": "img_1",
          "type": "image",
          "name": "Banner",
          "x": 100,
          "y": 120,
          "width": 320,
          "height": 180,
          "assetId": 2001
        }
      ]
    },
    "createdAt": "2026-04-09T10:00:00+08:00",
    "updatedAt": "2026-04-09T10:30:00+08:00"
  }
}
```

## 6.3 更新文档

### 请求

`PUT /api/documents/101`

```json
{
  "title": "首页 Banner",
  "schemaVersion": 1,
  "currentVersion": 7,
  "content": {
    "schemaVersion": 1,
    "canvas": {
      "width": 1200,
      "height": 800,
      "background": "#FFF8EF"
    },
    "layers": [
      {
        "id": "img_1",
        "type": "image",
        "name": "Banner",
        "x": 120,
        "y": 140,
        "width": 320,
        "height": 180,
        "assetId": 2001
      }
    ]
  }
}
```

### 成功响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 101,
    "currentVersion": 8,
    "updatedAt": "2026-04-09T10:31:00+08:00"
  }
}
```

### 版本冲突响应

```json
{
  "code": 40901,
  "message": "document version conflict",
  "data": {
    "serverVersion": 8
  }
}
```

## 6.4 上传素材

### 请求

`POST /api/assets`

请求类型：`multipart/form-data`

字段示例：

- `file`: 二进制文件
- `documentId`: `101`
- `kind`: `image`

### 响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 2001,
    "documentId": 101,
    "kind": "image",
    "filename": "banner.png",
    "mimeType": "image/png",
    "fileSize": 248312,
    "width": 1280,
    "height": 720,
    "url": "https://cdn.example.com/assets/2026/04/banner-2001.png",
    "createdAt": "2026-04-09T10:20:00+08:00"
  }
}
```

## 6.5 查询素材详情

### 请求

`GET /api/assets/2001`

### 响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 2001,
    "documentId": 101,
    "kind": "image",
    "filename": "banner.png",
    "mimeType": "image/png",
    "fileSize": 248312,
    "width": 1280,
    "height": 720,
    "url": "https://cdn.example.com/assets/2026/04/banner-2001.png",
    "createdAt": "2026-04-09T10:20:00+08:00"
  }
}
```

## 6.6 创建文档快照

### 请求

`POST /api/documents/101/revisions`

```json
{
  "message": "调整 Banner 位置和标题"
}
```

### 响应

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 3001,
    "documentId": 101,
    "versionNo": 8,
    "message": "调整 Banner 位置和标题",
    "createdAt": "2026-04-09T10:35:00+08:00"
  }
}
```

## 6.7 查询版本列表

### 请求

`GET /api/documents/101/revisions`

### 响应

```json
{
  "code": 0,
  "message": "OK",
  "data": [
    {
      "id": 3001,
      "documentId": 101,
      "versionNo": 8,
      "message": "调整 Banner 位置和标题",
      "createdAt": "2026-04-09T10:35:00+08:00"
    },
    {
      "id": 3000,
      "documentId": 101,
      "versionNo": 7,
      "message": "首次完成布局",
      "createdAt": "2026-04-09T10:10:00+08:00"
    }
  ]
}
```

---

## 7. 前后端交互流程建议

## 打开编辑器

1. 前端请求 `GET /api/documents/{id}`
2. 服务端返回文档内容和当前版本号
3. 前端把 `content` 和 `currentVersion` 放入 Zustand store
4. `EditorStage` 根据 `content.layers` 渲染画布

## 上传素材并插入图层

1. 前端选择图片
2. 调用 `POST /api/assets`
3. 后端返回 `assetId` 和访问地址
4. 前端新建一个 `image layer`
5. 把 `assetId` 写入该图层
6. 标记文档为脏数据

## 自动保存

1. 用户操作后更新 store
2. `isDirty = true`
3. `useAutoSave` 延迟触发保存
4. 调用 `PUT /api/documents/{id}`
5. 后端检查 `currentVersion`
6. 更新成功后返回新版本号
7. 前端调用 `markSaved(nextVersion)`

---

## 8. MVP 阶段不建议一开始做的事

- 不建议先把图层拆成数据库行级存储
- 不建议先做多人协作
- 不建议先做操作日志级回放
- 不建议先做复杂权限模型
- 不建议先直接绑定某个画布引擎的内部序列化协议

## 9. 后续扩展方向

当单人版稳定后，可以逐步增加：

- 评论和批注
- 分享和只读链接
- 操作日志级撤销重做
- 局部增量保存
- WebSocket 实时协作
- CRDT 或 OT 冲突处理

## 10. 一句话总结

单人版图层编辑器最稳妥的做法是：

- 前端用 `react-konva` 做图层编辑
- 后端用 Spring Boot 只存 `document(jsonb) + asset + revision`
- PostgreSQL 管文档和版本
- MinIO/S3 管素材文件

这套方案实现成本低，后续扩展到多人协作时也不需要推翻重来。

---

## 11. AI图像处理模块架构

### 模块概述

AI图像处理模块集成火山引擎（字节跳动豆包）视觉智能API，提供以下功能：

| 功能 | API Action | 说明 |
|------|------------|------|
| 智能抠图 | SegmentImage / SegmentHumanBody | 去除背景，提取主体 |
| AI扩图 | ImageOutpainting | 智能扩展图片边界 |
| 消除笔 | ImageInpainting | 消除杂物、水印 |
| 超分辨率 | ImageSuperResolution | 图片画质增强 |

### 后端包结构

```text
com.example.editor.ai
├── client
│   ├── VolcengineVisualClient.java    # OpenFeign客户端
│   └── VolcengineFeignConfig.java     # 签名认证拦截器
├── config
│   └── VolcengineProperties.java      # 配置属性类
├── controller
│   └── AiImageController.java         # API控制器
├── dto
│   ├── AiStatusResponse.java          # 状态响应
│   ├── VolcengineMattingRequest.java  # 抠图请求
│   ├── VolcengineResponse.java        # 通用响应
│   └── ...
└── service
    └── AiImageService.java            # AI服务层
```

### OpenFeign + HttpClient5 架构

使用OpenFeign声明式客户端调用火山引擎API：

```java
@FeignClient(
    name = "volcengine-visual",
    url = "${app.volcengine.endpoint}",
    configuration = VolcengineFeignConfig.class
)
public interface VolcengineVisualClient {
    @PostMapping("/")
    VolcengineResponse matting(@RequestParam("Action") String action,
                               @RequestParam("Version") String version,
                               @RequestBody VolcengineMattingRequest request);
}
```

配置HttpClient5连接池：

```java
@Configuration
public class HttpClientConfig {
    @Bean
    public PoolingHttpClientConnectionManager poolingConnectionManager() {
        PoolingHttpClientConnectionManager manager = new PoolingHttpClientConnectionManager();
        manager.setMaxTotal(200);
        manager.setDefaultMaxPerRoute(50);
        return manager;
    }
    
    @Bean
    public Client feignClient(CloseableHttpClient httpClient) {
        return new ApacheHttp5Client(httpClient);
    }
}
```

### 签名认证

火山引擎使用类似AWS Signature V4的签名算法：

```java
public class VolcengineSignatureInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        String now = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")
            .withZone(ZoneOffset.UTC)
            .format(Instant.now());
        
        // 构建规范请求
        // 计算签名
        // 添加Authorization头
        template.header("X-Date", now);
        template.header("Authorization", authorization);
    }
}
```

### SSRF防护

AI服务层实现SSRF防护，禁止访问私有网络：

```java
private static final Set<String> BLOCKED_URL_PATTERNS = Set.of(
    "localhost", "127.0.0.1", "0.0.0.0",
    "10.", "192.168.", "172.16.", "172.17.", ..., "172.31.",
    "::1", "0:0:0:0:0:0:0:1", "fc00:", "fd00:"
);

private void validateImageUrl(String imageUrl) {
    String host = extractHost(imageUrl);
    for (String blocked : BLOCKED_URL_PATTERNS) {
        if (host.equalsIgnoreCase(blocked) || host.startsWith(blocked)) {
            throw new IllegalArgumentException("Access to private network URLs is not allowed");
        }
    }
}
```

### 前端集成

```typescript
// frontend/src/features/editor/api/aiImage.ts
export async function mattingImage(imageUrl: string, type: 'human' | 'general'): Promise<string> {
  const response = await fetch('/api/ai/matting', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, type })
  });
  return response.json();
}
```

在PropertyPanel添加AI工具按钮：

```tsx
const AIImageTools: FC<{ layer: ImageLayer }> = ({ layer }) => (
  <div>
    <SectionHeader title="AI Tools" />
    <Button onClick={handleMatting}>抠图</Button>
    <Button onClick={handleOutpainting}>扩图</Button>
    <Button onClick={handleInpainting}>消除</Button>
    <Button onClick={handleSuperResolution}>增强</Button>
  </div>
);
```

---

## 12. 安全架构设计

### 认证方案

使用HTTP Basic认证，适合单人版快速部署：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic(httpBasic -> {});
        return http.build();
    }
}
```

### CORS配置

支持多端口开发环境：

```java
private CorsConfigurationSource corsConfigurationSource() {
    return request -> {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedOrigin("http://localhost:5174");
        // ... 5175-5179
        config.addAllowedOrigin("http://localhost:3000");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        return config;
    };
}
```

### 文件上传安全

```java
@PostMapping("/upload")
public AssetResponse upload(@RequestParam("file") MultipartFile file) {
    // 1. 校验文件类型
    String mimeType = file.getContentType();
    if (!ALLOWED_TYPES.contains(mimeType)) {
        throw new IllegalArgumentException("Invalid file type");
    }
    
    // 2. 校验文件大小
    if (file.getSize() > MAX_FILE_SIZE) {
        throw new IllegalArgumentException("File too large");
    }
    
    // 3. 计算SHA256哈希
    String sha256 = calculateSha256(file.getBytes());
    
    // 4. 保存文件
    // ...
}
```

### SVG Sanitizer

防止SVG文件中的XSS攻击：

```java
@Component
public class SvgSanitizer {
    private final ElementsPolicy ELEMENT_POLICY = ElementsPolicy.Builder()
        .allowElements("svg", "path", "circle", "rect", "line", "polygon", "g", ...)
        .build();
    
    public String sanitize(String svgContent) {
        return HtmlPolicyBuilder.factory().toPolicy(ELEMENT_POLICY)
            .sanitize(svgContent);
    }
}
```

---

## 13. 配置管理架构

### Properties集中配置

使用`@ConfigurationProperties`替代分散的`@Value`：

```java
@Data
@Component
@ConfigurationProperties(prefix = "app.volcengine")
public class VolcengineProperties {
    private String accessKey;
    private String secretKey;
    private String endpoint = "https://visual.volcengineapi.com";
    private String service = "cv";
    private String region = "cn-north-1";
    private String version = "2022-08-31";
    
    public boolean isConfigured() {
        return accessKey != null && !accessKey.isEmpty()
            && secretKey != null && !secretKey.isEmpty();
    }
}
```

```java
@Data
@Component
@ConfigurationProperties(prefix = "feign.httpclient")
public class HttpClientProperties {
    private int maxConnections = 200;
    private int maxConnectionsPerRoute = 50;
    private long connectionTimeout = 5000;
    private long socketTimeout = 60000;
    private long connectionTtl = 1800000;
    private long idleTimeout = 600000;
}
```

### 多环境配置

通过Spring Profile支持多环境：

```yaml
# application.yml (通用配置)
spring:
  profiles:
    active: ${SPRING_PROFILE:windows}

# application-mac.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/layer_editor
    username: jyy
    password:

# application-windows.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/layer_editor
    username: postgres
    password: postgres
```

启动时指定Profile：

```bash
# Mac
export SPRING_PROFILE=mac
mvn spring-boot:run

# Windows
set SPRING_PROFILE=windows
mvn spring-boot:run
```

---

## 14. 连接池配置

### 数据库连接池 (HikariCP)

```yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      connection-timeout: 30000          # 30秒获取连接超时
      idle-timeout: 600000               # 10分钟空闲连接超时
      max-lifetime: 1800000              # 30分钟连接最大生命周期
      validation-timeout: 5000           # 5秒验证连接超时
      leak-detection-threshold: 60000    # 60秒连接泄露检测
      pool-name: LayerEditorHikariPool
```

### HTTP连接池 (HttpClient5)

```yaml
feign:
  httpclient:
    max-connections: 200
    max-connections-per-route: 50
    connection-timeout: 5000             # 5秒连接超时
    socket-timeout: 60000                # 60秒Socket超时（AI处理可能耗时）
    connection-ttl: 1800000              # 30分钟连接生命周期
    idle-timeout: 600000                 # 10分钟空闲连接超时
```

---

## 15. 版本历史

| 版本 | 主要更新 |
|------|----------|
| v0.3 | AI图像处理模块（火山引擎集成）、OpenFeign+HttpClient5、配置Properties重构 |
| v0.2 | SVG/Sketch导入解析、安全加固（SSRF防护、SVG Sanitizer）、CORS修复 |
| v0.1 | 基础图层编辑功能、文档/素材/版本管理 |

---

## 附录：API接口完整列表

### 文档 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/documents?page=0&size=20` | 文档列表（分页） |
| GET | `/api/documents/{id}` | 文档详情 |
| POST | `/api/documents` | 创建文档 |
| PUT | `/api/documents/{id}` | 更新文档（乐观锁） |
| DELETE | `/api/documents/{id}` | 删除文档（软删除） |

### 素材 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/assets` | 素材列表 |
| GET | `/api/assets/{id}` | 素材详情 |
| POST | `/api/assets/upload` | 上传素材 |
| DELETE | `/api/assets/{id}` | 删除素材 |

### AI图像处理 API

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
| GET | `/api/documents/{id}/revisions/{revisionId}` | 版本详情 |
| POST | `/api/documents/{id}/revisions` | 创建版本快照 |
