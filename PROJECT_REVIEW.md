# Layer Editor 项目审视报告

日期：2026-04-30

## 结论摘要

这次按你已经完成的一轮优化重新审视后，项目状态比上一版报告更好，尤其是前端生产构建已经恢复正常，`LayerRenderer` 里最危险的 Hook 条件调用问题也已经被处理掉。

更新后的判断是：

- 文件过大、`history` 单例、测试/CI 缺失，这三类更适合作为架构改进项，而不是当前发布阻塞项。
- 当前真正值得保留为高优先级的问题，主要集中在 SVG 上传安全边界、少量仍然有语义风险的 lint 错误，以及后端构建环境约束没有明确固化。
- 大部分剩余 lint 问题属于代码质量债，不必和功能阻塞混在一起。

## 本次复查范围

- 前端：`npm run build`、`npm run lint`
- 后端：`mvn -q -DskipTests compile`
- 重点代码路径：
- `frontend/src/features/editor/components/canvas/LayerRenderer.tsx`
- `frontend/src/features/editor/components/panel/PropertyPanel.tsx`
- `frontend/src/features/editor/components/layout/EditorLayout.tsx`
- `frontend/src/features/editor/hooks/useKeyboardShortcuts.ts`
- `frontend/src/features/editor/api/document.ts`
- `backend/src/main/java/com/example/editor/asset/service/AssetService.java`
- `backend/src/main/java/com/example/editor/asset/controller/AssetController.java`
- `backend/src/main/java/com/example/editor/document/service/DocumentService.java`
- `backend/src/main/java/com/example/editor/common/config/WebConfig.java`
- `backend/src/main/java/com/example/editor/common/security/SecurityConfig.java`

## 当前状态快照

### 已确认修复

- 前端生产构建已通过。
- `DocumentListResponse` 导出问题已修复，见 `frontend/src/features/editor/api/document.ts:17`。
- `LayerRenderer` 中原先的 `react-hooks/rules-of-hooks` 问题已解除，当前 `SvgComponent` 已把复杂 SVG 渲染切到独立组件，见 `frontend/src/features/editor/components/canvas/LayerRenderer.tsx:614`。
- `AssetService` 的单个删除现在也会清理缩略图。
- `cleanupOrphanedFiles()` 的删除计数已补齐。

### 当前检查结果

- 前端构建：通过
- 前端 lint：失败，`105 problems (95 errors, 10 warnings)`
- 后端编译：在当前本机环境失败

### 对后端编译失败的解释

当前机器 `java -version` 是 22.0.2，而项目在 `backend/pom.xml:20` 到 `backend/pom.xml:22` 明确声明了 Java 21。复查时 `mvn -q -DskipTests compile` 失败，报的是 `lombok`/`javac` 初始化错误。这个问题更像“构建环境约束没有被写死或校验清楚”，不一定是业务代码本身坏了，但它确实会影响其他开发者复现和接手。

## 发布前建议优先处理

### 1. SVG 上传链路仍存在未清洗内容落盘并公开访问的问题

这是我认为当前最值得优先保留的高优先级问题。

- 通用素材上传接口允许客户端直接传 `kind`，见 `backend/src/main/java/com/example/editor/asset/controller/AssetController.java:26`。
- `AssetService` 现在已经允许 `.svg` 进入白名单，但条件只是 `kind="svg"`，见 `backend/src/main/java/com/example/editor/asset/service/AssetService.java:79`、`backend/src/main/java/com/example/editor/asset/service/AssetService.java:485` 和 `backend/src/main/java/com/example/editor/asset/service/AssetService.java:497`。
- 这条上传链路里没有在 `AssetService` 内做 `SvgSanitizer` 清洗。
- `DocumentService` 虽然会 sanitize SVG，但它是在先调用 `assetService.upload(...)` 之后才清洗并写入文档内容，见 `backend/src/main/java/com/example/editor/document/service/DocumentService.java:60` 到 `backend/src/main/java/com/example/editor/document/service/DocumentService.java:68`。
- 上传的文件又会通过 `/uploads/**` 直接公开暴露，见 `backend/src/main/java/com/example/editor/common/config/WebConfig.java:21` 到 `backend/src/main/java/com/example/editor/common/config/WebConfig.java:24`、`backend/src/main/java/com/example/editor/common/security/SecurityConfig.java:53` 到 `backend/src/main/java/com/example/editor/common/security/SecurityConfig.java:57`，以及 `backend/src/main/resources/application.yml:59` 到 `backend/src/main/resources/application.yml:62`。

这意味着：

- 如果有人直接调用 `/api/assets` 并传 `kind=svg`，SVG 可以绕过 `DocumentService` 的清洗逻辑落盘。
- 即使是 `DocumentService` 导入 SVG，当前也是“先保存原文件，再生成清洗后的文档层数据”，并不是“只保存清洗后的 SVG”。

建议方向：

- 保留你提出的设计思路，即“不是全面放开 SVG，而是带明确语义地允许 `kind=svg`”。
- 但这条设计要真正落地，`AssetService` 自己也必须对 SVG 做清洗，或者明确禁止通用素材接口直接接收原始 SVG。

### 2. 剩余 lint 中还有少量不是样式问题，而是语义级风险

虽然大多数 lint 确实属于质量债，但不是全部都可以忽略。

- `frontend/src/features/editor/components/panel/PropertyPanel.tsx:1091` 到 `frontend/src/features/editor/components/panel/PropertyPanel.tsx:1109`，`useEffect` 里先使用了 `redrawCanvas`，而 `redrawCanvas` 在后面才声明；当前规则已经把它标成 error。
- `frontend/src/features/editor/components/layout/EditorLayout.tsx:89` 到 `frontend/src/features/editor/components/layout/EditorLayout.tsx:128`，React Compiler 认为现有 memoization 依赖不成立。
- `frontend/src/features/editor/hooks/useKeyboardShortcuts.ts:103` 到 `frontend/src/features/editor/hooks/useKeyboardShortcuts.ts:107` 同样存在类似的 memoization 依赖问题。

这些问题不一定阻塞今天的页面运行，但它们已经超出了“代码风格”范围，建议在近期修掉，避免以后重构时出现更隐蔽的问题。

### 3. 后端运行环境约束需要显式化

这一条我不再把它定义成业务 bug，但它值得进入近期待办。

- 项目要求 Java 21，见 `backend/pom.xml:20` 到 `backend/pom.xml:22`。
- 当前机器如果直接用 Java 22 编译，会触发 `lombok` 相关错误。

建议方向：

- 在启动文档里写清必须使用 JDK 21。
- 最好再补一层自动校验，例如 Maven Enforcer 或启动脚本里的版本检查，避免“代码没问题但环境一换就红”。

## 中优先级改进项

### 1. 文档与实现仍有轻微漂移

- 上一版报告里提到的部分差异仍然存在，例如 README、架构文档中的版本和路径描述没有完全跟上代码。
- 这不是当前功能阻塞，但会影响后来者判断真实系统边界。

建议方向：

- 至少同步技术栈版本、认证方式、上传策略和导入链路说明。

### 2. 导入链路仍然偏分散，需要后续收敛

- 前端本地文件导入、后端文档导入、素材上传、SVG 图层导入现在还是多条路径并行。
- 这在原型阶段是可以接受的，但功能一多，就会开始出现“同一类文件在不同入口表现不同”的问题。

建议方向：

- 后续把“本地图片前端解析”“服务器 SVG 文档导入”“素材上传入库”三类路径的职责边界整理成一张统一流程图。

## 架构 backlog

下面这些问题依然真实存在，但我同意它们不应该继续被写成当前发布阻塞。

### 1. 核心文件体量偏大

- `frontend/src/pages/document-list/index.tsx`：856 行
- `frontend/src/features/editor/store/editorStore.ts`：822 行
- `frontend/src/features/editor/utils/svgParser.ts`：752 行
- `frontend/src/features/editor/components/canvas/LayerRenderer.tsx`：接近 700 行
- `backend/src/main/java/com/example/editor/asset/service/AssetService.java`：780 行

这类问题更适合在功能稳定后渐进拆分，而不是在当前阶段做大规模重构。

### 2. `history` 模块级单例设计

- `frontend/src/features/editor/store/history.ts` 仍然使用模块级状态保存历史栈。
- 如果当前产品模型就是单文档编辑器，这个设计暂时可接受。
- 但如果未来出现多文档并行、多标签页或嵌入式编辑器，它会成为明显限制。

建议把它记录为未来扩展前必须处理的点，而不是当前阻塞。

### 3. 测试与 CI 护栏缺失

- 目前前后端测试基本为空，CI 也没有建立起来。
- 对原型项目来说，这条更像“演进成本问题”，不是“今天不能发”的问题。

建议方向：

- 先补最小 smoke 级别测试和最基本的 CI，再逐步加深覆盖。

## 对剩余 lint 的判断

这次复查后，我不再把“105 个 lint 问题”整体定义成高危。

更准确的表述应该是：

- 其中大多数是 `no-explicit-any`、`no-unused-vars`、`exhaustive-deps` 之类的质量债。
- 只有少数属于真正建议近期处理的语义级问题。
- 因此后续治理 lint 时，应该把“阻塞类错误”和“可渐进清理的质量项”拆开看待。

## 推荐的处理顺序

### 第一阶段

- 先收紧 SVG 上传安全边界，确保不会把未清洗 SVG 直接落盘并公开提供。
- 处理剩余 lint 里少数语义级问题。
- 明确后端 Java 21 的环境要求，并让构建脚本或文档能约束住它。

### 第二阶段

- 同步 README、架构文档和真实实现。
- 梳理导入链路的职责边界。

### 第三阶段

- 渐进拆分超大文件。
- 视产品路线决定是否重构 `history` 模块。
- 逐步补测试和 CI。

## 一句话判断

这次优化之后，项目已经从“基础健康度明显失衡”回到了“可继续推进的原型工程”状态。当前最该盯住的，不再是全面重构，而是把 SVG 上传安全边界、少量语义级错误和运行环境约束收紧，随后再有节奏地清理架构债。
