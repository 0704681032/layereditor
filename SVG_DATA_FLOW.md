# Layer Editor 数据流程文档

本文档描述 SVG 上传、解析、编辑、保存的完整数据流程，帮助理解系统架构。

---

## 1. 系统架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户操作流程                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   上传 SVG ──► 后端存储 ──► 前端加载 ──► 编辑图层 ──► 自动保存    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| 层级 | 技术栈 | 职责 |
|------|--------|------|
| 前端 | React + Konva + Zustand | 图层渲染、编辑、状态管理 |
| 后端 | Spring Boot + MyBatis | 文档 CRUD、文件存储 |
| 数据库 | PostgreSQL | JSON 文档存储 |

---

## 2. 数据库表结构

### editor_document 表

```sql
create table editor_document (
    id               bigserial primary key,
    owner_id         bigint not null,
    title            varchar(200) not null,
    status           varchar(32) default 'draft',
    schema_version   int default 1,
    current_version  int default 1,
    content          jsonb not null,         -- ⭐ 核心字段
    cover_asset_id   bigint,
    created_at       timestamptz default now(),
    updated_at       timestamptz default now(),
    deleted_at       timestamptz
);
```

**重点：`content` 字段（jsonb 类型）存储整个文档的图层结构。**

---

## 3. content JSON 结构

### 完整结构定义

```json
{
  "schemaVersion": 1,
  "canvas": {
    "width": 800,
    "height": 600,
    "background": "#FFFFFF"
  },
  "layers": [
    // 图层数组，每个图层有不同 type
  ]
}
```

### 图层类型定义

| type | TypeScript 类型 | 说明 | 必需字段 |
|------|-----------------|------|----------|
| `svg` | SvgLayer | 未分解的 SVG | `svgData` |
| `rect` | RectLayer | 矩形 | `fill`, `width`, `height` |
| `text` | TextLayer | 文本 | `text`, `fontSize`, `fontFamily` |
| `image` | ImageLayer | 图片 | `assetId` 或 `src` |
| `group` | GroupLayer | 图层组 | `children` |

### 各类型完整字段

```typescript
// 基础字段（所有类型都有）
interface BaseLayer {
  id: string;          // 唯一ID，如 "layer_abc123"
  type: LayerType;     // 图层类型
  name: string;        // 显示名称
  x: number;           // X坐标
  y: number;           // Y坐标
  width?: number;      // 宽度
  height?: number;     // 高度
  rotation?: number;   // 旋转角度
  visible?: boolean;   // 是否可见
  locked?: boolean;    // 是否锁定
  opacity?: number;    // 透明度
}

// SVG 图层
interface SvgLayer extends BaseLayer {
  type: 'svg';
  svgData: string;     // ⭐ 原始SVG字符串
  fill?: string;
  stroke?: string;
}

// 矩形图层
interface RectLayer extends BaseLayer {
  type: 'rect';
  fill?: string;       // 填充颜色
  stroke?: string;     // 边框颜色
  strokeWidth?: number;
  cornerRadius?: number;
}

// 文本图层
interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;        // ⭐ 文本内容
  fontSize?: number;
  fontFamily?: string;
  fill?: string;       // 文字颜色
  fontStyle?: string;  // "bold" | "italic" | "bold italic"
  align?: string;      // "left" | "center" | "right"
}

// 图片图层
interface ImageLayer extends BaseLayer {
  type: 'image';
  assetId?: number;    // 上传图片的资产ID
  src?: string;        // 预设图片URL
}

// 图层组
interface GroupLayer extends BaseLayer {
  type: 'group';
  children: EditorLayer[];  // ⭐ 子图层数组
}
```

---

## 4. SVG 上传流程

### 4.1 后端处理流程

用户上传 SVG 文件 → `POST /documents/import-file`

```java
// DocumentService.java - importFromFile()
public DocumentDetailResponse importFromFile(MultipartFile file, String title) {
    // 1. 判断是否是SVG
    boolean isSvg = isSvgFile(file);

    // 2. 上传文件到 Asset 存储
    AssetResponse asset = assetService.upload(file, null, "svg");

    // 3. 构建 content JSON
    JsonNode content = buildSvgDocumentContent(file, title);

    // 4. 存入数据库
    EditorDocument doc = new EditorDocument();
    doc.setContent(content.toString());
    documentMapper.insert(doc);

    return getDetail(doc.getId());
}

// buildSvgDocumentContent() - 构建 JSON
private JsonNode buildSvgDocumentContent(MultipartFile file, String title) {
    String svgData = new String(file.getBytes());   // 读取完整SVG
    SvgSize size = extractSvgSize(svgData);         // 提取宽高

    // 构建结构
    ObjectNode content = createContentRoot(size.width(), size.height());
    ArrayNode layers = content.withArray("layers");
    layers.add(svgLayer(title, 0, 0, size.width(), size.height(), svgData));
    return content;
}
```

### 4.2 后端做的事情

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 判断文件类型 | 检查 Content-Type 或 .svg 后缀 |
| 2 | 存储文件 | 上传到 Asset 存储（备用） |
| 3 | 提取尺寸 | 从 `viewBox` 或 `width/height` 属性解析 |
| 4 | 构建 JSON | 创建 content 结构，把完整 SVG 字符串放入 `svgData` |

**后端不解析 SVG 内部元素，只提取尺寸并存储完整字符串。**

---

## 5. JSON 数据变化过程

### 5.1 上传后的初始状态

用户上传 `poster.svg`（包含一个矩形和一段文字）：

```json
{
  "schemaVersion": 1,
  "canvas": {
    "width": 800,
    "height": 600,
    "background": "#FFFFFF"
  },
  "layers": [
    {
      "id": "layer_abc123",
      "type": "svg",
      "name": "poster",
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600,
      "visible": true,
      "locked": false,
      "svgData": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 800 600\"><rect x=\"0\" y=\"0\" width=\"800\" height=\"600\" fill=\"#764ba2\"/><text x=\"400\" y=\"300\" font-size=\"48\" fill=\"white\">Hello</text></svg>"
    }
  ]
}
```

**特点：**
- 只有一个图层，`type: "svg"`
- 完整 SVG 字符串在 `svgData` 字段中
- 用户无法编辑内部元素（只能整体移动/缩放）

---

### 5.2 Ungroup 分解后

用户点击 "Ungroup" 按钮，前端解析 `svgData`：

```json
{
  "schemaVersion": 1,
  "canvas": {
    "width": 800,
    "height": 600,
    "background": "#FFFFFF"
  },
  "layers": [
    {
      "id": "layer_rect1",
      "type": "rect",
      "name": "Rectangle",
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600,
      "visible": true,
      "locked": false,
      "fill": "#764ba2",
      "stroke": null,
      "strokeWidth": null,
      "cornerRadius": 0
    },
    {
      "id": "layer_text1",
      "type": "text",
      "name": "Text: \"Hello\"",
      "x": 400,
      "y": 276,
      "visible": true,
      "locked": false,
      "text": "Hello",
      "fontSize": 48,
      "fontFamily": "Arial",
      "fill": "white",
      "fontStyle": null,
      "align": "center"
    }
  ]
}
```

**变化：**
| 变化项 | 说明 |
|--------|------|
| `type` | `"svg"` → `"rect"` + `"text"` |
| `svgData` | **消失**（不再需要） |
| 图层数量 | 1 → 2 |
| 新增字段 | `fill`, `text`, `fontSize` 等类型专有字段 |

**前端解析逻辑（svgParser.ts）：**
```typescript
export function parseSvgElements(svgData: string): ParsedSvgElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgData, 'image/svg+xml');
  // 遍历 SVG 元素，提取 text, rect, path 等
  // 转换为对应的 EditorLayer 类型
}
```

---

### 5.3 用户编辑后

用户修改：
- 矩形颜色：`#764ba2` → `#ff6b00`
- 文字内容：`Hello` → `World`
- 文字字号：`48` → `64`

```json
{
  "schemaVersion": 1,
  "canvas": {
    "width": 800,
    "height": 600,
    "background": "#FFFFFF"
  },
  "layers": [
    {
      "id": "layer_rect1",
      "type": "rect",
      "name": "Rectangle",
      "x": 0,
      "y": 0,
      "width": 800,
      "height": 600,
      "visible": true,
      "locked": false,
      "fill": "#ff6b00",        // ← 改了
      "cornerRadius": 0
    },
    {
      "id": "layer_text1",
      "type": "text",
      "name": "Text: \"World\"",
      "x": 400,
      "y": 244,                 // ← 随 fontSize 调整
      "visible": true,
      "locked": false,
      "text": "World",          // ← 改了
      "fontSize": 64,           // ← 改了
      "fontFamily": "Arial",
      "fill": "white",
      "align": "center"
    }
  ]
}
```

---

### 5.4 添加新 SVG 图层

用户从形状库拖入一个星形：

```json
{
  "layers": [
    // ... 原有的 rect 和 text 图层 ...
    {
      "id": "layer_new123",
      "type": "svg",
      "name": "Star",
      "x": 600,
      "y": 400,
      "width": 100,
      "height": 100,
      "visible": true,
      "locked": false,
      "svgData": "<svg>...星形SVG...</svg>"    // ← 又有 svgData
    }
  ]
}
```

---

## 6. svgData 字段规律

| 操作 | type | svgData 是否存在 | 原因 |
|------|------|-----------------|------|
| 上传 SVG | `"svg"` | ✅ 存在 | 存储原始 SVG |
| 编辑 SVG 图层位置 | `"svg"` | ✅ 存在 | 类型未变 |
| Ungroup 分解 | `"rect"` `"text"` | ❌ 消失 | 类型变了，用属性字段渲染 |
| 编辑分解后的图层 | `"rect"` `"text"` | ❌ 无 | 用 `fill`、`text` 等字段 |
| 添加新 SVG 形状 | `"svg"` | ✅ 存在 | 新的 svg 类型 |

**核心规则：`svgData` 只存在于 `type: "svg"` 的图层中。**

---

## 7. 前端渲染机制

### 7.1 LayerRenderer 组件

```tsx
// frontend/src/features/editor/components/canvas/LayerRenderer.tsx
export const LayerRenderer: FC<{ layer: EditorLayer }> = ({ layer }) => {
  switch (layer.type) {
    case 'rect':
      return <RectComponent layer={layer} />;
    case 'text':
      return <TextComponent layer={layer} />;
    case 'image':
      return <ImageComponent layer={layer} />;
    case 'group':
      return <GroupComponent layer={layer} />;
    case 'svg':
      return <SvgComponent layer={layer} />;
    default:
      return null;
  }
};
```

**根据 `type` 字段自动选择渲染组件。**

### 7.2 各类型渲染方式

| type | Konva 元素 | 数据来源 |
|------|-----------|----------|
| `rect` | `<Rect>` | 直接用 `fill`, `width`, `height` 绘制 |
| `text` | `<Text>` | 直接用 `text`, `fontSize` 绘制 |
| `image` | `<Image>` | 从 `assetId` 加载图片 URL |
| `svg` | `<Image>` | 把 `svgData` 转 Blob URL 加载为图片 |
| `group` | `<Group>` | 递归渲染 `children` |

### 7.3 SVG 类型特殊处理

```tsx
// SvgComponent
const SvgComponent: FC<{ layer: SvgLayer }> = ({ layer }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    // svgData 字符串 → Blob → Image
    const blob = new Blob([layer.svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new window.Image();
    img.src = url;
    img.onload = () => setImage(img);
  }, [layer.svgData]);

  return <KonvaImage image={image} x={layer.x} y={layer.y} ... />;
};
```

**SVG 类型作为整体图片渲染，无法编辑内部元素。**

---

## 8. 编辑保存流程

### 8.1 状态管理（Zustand Store）

```typescript
// editorStore.ts
interface EditorState {
  documentId: number | null;
  content: EditorDocumentContent | null;   // ⭐ 当前文档内容
  isDirty: boolean;                         // 是否有修改
  // ...
}
```

用户编辑图层时，Store 更新 `content`，设置 `isDirty = true`。

### 8.2 自动保存机制

```typescript
// useAutoSave.ts
export function useAutoSave(delayMs = 3000) {
  const content = useEditorStore((s) => s.content);
  const isDirty = useEditorStore((s) => s.isDirty);

  useEffect(() => {
    if (!isDirty) return;
    // 延迟 3 秒后保存
    timerRef.current = setTimeout(async () => {
      await updateDocument(documentId, {
        title,
        content,  // ⭐ 发送整个 content JSON
        currentVersion,
        schemaVersion
      });
      markSaved();  // isDirty = false
    }, delayMs);
  }, [isDirty]);
}
```

### 8.3 API 调用

```typescript
// document.ts
export async function updateDocument(id: number, data: UpdateDocumentRequest) {
  return api.put(`/documents/${id}`, data);
}
```

### 8.4 后端接收

```java
// DocumentController.java
@PutMapping("/{id}")
public DocumentUpdateResponse update(@PathVariable Long id,
    @RequestBody UpdateDocumentRequest request) {
    return service.update(id, request);
}

// DocumentService.java
public DocumentUpdateResponse update(Long id, UpdateDocumentRequest request) {
    documentMapper.updateDocument(
        id, DEFAULT_USER_ID,
        request.title(),
        request.schemaVersion(),
        request.content().toString(),  // ⭐ 存入数据库
        request.currentVersion()
    );
}
```

---

## 9. 完整流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SVG 上传 → 编辑 → 保存                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  用户上传 SVG 文件                                                        │
│        │                                                                │
│        ▼                                                                │
│  POST /documents/import-file                                            │
│        │                                                                │
│        ├── 后端提取 SVG 尺寸                                              │
│        ├── 后端存储完整 SVG 字符串到 svgData                               │
│        ├── 后端创建 document 记录                                         │
│        │                                                                │
│        ▼                                                                │
│  content = { layers: [{ type: "svg", svgData: "..." }] }               │
│        │                                                                │
│        ▼                                                                │
│  前端加载文档                                                             │
│        │                                                                │
│        ├── LayerRenderer 根据 type 选择组件                               │
│        ├── type="svg" → SvgComponent → 渲染为整体图片                      │
│        │                                                                │
│        ▼                                                                │
│  用户点击 Ungroup                                                         │
│        │                                                                │
│        ├── 前端解析 svgData                                               │
│        ├── 生成多个图层 { type: "rect" }, { type: "text" }               │
│        ├── svgData 消失                                                   │
│        │                                                                │
│        ▼                                                                │
│  content = { layers: [{ type: "rect" }, { type: "text" }] }            │
│        │                                                                │
│        ▼                                                                │
│  用户编辑图层属性                                                          │
│        │                                                                │
│        ├── 修改 fill、text、fontSize 等                                   │
│        ├── editorStore.content 更新                                      │
│        ├── isDirty = true                                                │
│        │                                                                │
│        ▼                                                                │
│  自动保存（3秒延迟）                                                        │
│        │                                                                │
│        ├── PUT /documents/{id}                                           │
│        ├── 发送整个 content JSON                                          │
│        ├── 后端存入 editor_document.content                               │
│        ├── isDirty = false                                               │
│        │                                                                │
│        ▼                                                                │
│  完成                                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. 关键代码位置

| 功能 | 文件位置 |
|------|----------|
| 后端上传处理 | `backend/.../DocumentService.java:importFromFile()` |
| 后端构建 JSON | `backend/.../DocumentService.java:buildSvgDocumentContent()` |
| 前端 SVG 解析 | `frontend/.../svgParser.ts:parseSvgElements()` |
| 前端 Ungroup | `frontend/.../svgParser.ts:ungroupSvgLayer()` |
| 前端状态管理 | `frontend/.../editorStore.ts` |
| 前端渲染组件 | `frontend/.../LayerRenderer.tsx` |
| 前端自动保存 | `frontend/.../useAutoSave.ts` |
| 图层类型定义 | `frontend/.../types/layer.ts` |

---

## 11. 总结要点

1. **数据库只存一个 JSON**：`editor_document.content` 字段（jsonb）
2. **后端不解析 SVG 元素**：只提取尺寸，存储完整字符串
3. **前端负责解析**：Ungroup 时解析 `svgData`，拆分为可编辑图层
4. **type 决定渲染**：前端根据 `type` 字段选择 Konva 组件
5. **svgData 规律**：只存在于 `type: "svg"` 图层，Ungroup 后消失
6. **自动保存**：编辑后延迟 3 秒，发送整个 content 到后端

---

*文档编写日期：2026-04-10*