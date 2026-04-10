# 图层编辑器启动指南

## 环境要求

- **Java 21** - 推荐使用 Homebrew 安装
- **Node.js 18+**
- **PostgreSQL 16**

## 安装 Java 21

```bash
# 使用 Homebrew 安装
brew install openjdk@21

# 设置 JAVA_HOME (添加到 ~/.zshrc 或 ~/.bashrc)
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home
```

## 启动步骤

### 1. 启动 PostgreSQL

确保 PostgreSQL 服务已启动，数据库 `layer_editor` 已创建。

```bash
# macOS 使用 Homebrew 安装的 PostgreSQL
brew services start postgresql@16

# 或使用 Docker
cd /Users/jyy/Documents/opensources/layereditor
docker-compose up -d
```

### 2. 启动后端

```bash
cd /Users/jyy/Documents/opensources/layereditor/backend

# 设置 JAVA_HOME
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home

# 编译并启动
mvn spring-boot:run
```

后端启动成功后访问: http://localhost:8080

### 3. 启动前端

```bash
cd /Users/jyy/Documents/opensources/layereditor/frontend

# 安装依赖 (首次运行)
npm install

# 启动开发服务器
npm run dev
```

前端启动成功后访问: http://localhost:5173

## 一键启动脚本

创建 `start.sh`:

```bash
#!/bin/bash

# 启动后端
cd /Users/jyy/Documents/opensources/layereditor/backend
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home
mvn spring-boot:run &

# 等待后端启动
sleep 5

# 启动前端
cd /Users/jyy/Documents/opensources/layereditor/frontend
npm run dev &

echo "服务已启动:"
echo "  后端: http://localhost:8080"
echo "  前端: http://localhost:5173"
```

## 端口说明

| 服务 | 端口 |
|------|------|
| 前端 (Vite) | 5173 |
| 后端 (Spring Boot) | 8080 |
| PostgreSQL | 5432 |

## 常见问题

### 端口被占用

```bash
# 查找占用端口的进程
lsof -i :8080
lsof -i :5173

# 终止进程
kill -9 <PID>
```

### Java 版本问题

确保使用 Java 21，而不是 Java 22 (lombok 兼容性问题):

```bash
# 检查 Java 版本
java --version

# 如果版本不对，设置 JAVA_HOME
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home
```

### 数据库连接失败

检查 `backend/src/main/resources/application.yml` 中的数据库配置:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/layer_editor
    username: jyy
    password:
```

## 功能说明

### 工具栏按钮

| 按钮 | 功能 |
|------|------|
| ➕ plus-square | 添加矩形 |
| A font-size | 添加文本 |
| 🖼️ picture | 本地图片选择 |
| 📦 appstore | **素材库** (远程素材选择) |
| ⭐ star | SVG 形状库 |
| 📁 folder | 添加分组 |
| ↩️ undo/redo | 撤销/重做 |
| 💾 save | 保存 |
| ⬇️ download | 导出 PNG |

### 素材库功能

1. 点击工具栏的素材库按钮 (📦)
2. 在弹出面板中查看已上传的素材
3. 点击素材卡片插入到画布
4. 使用"上传"按钮添加新素材
5. 素材使用 `assetId` 关联，支持远程加载