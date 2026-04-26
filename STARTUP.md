# 图层编辑器启动指南

## 环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 21 | LTS版本，Lombok兼容 |
| Node.js | 18+ | 前端构建 |
| PostgreSQL | 16 | 数据库 |
| Maven | 3.8+ | 后端构建（替代mvnw） |

## 安装环境

### Windows 安装

**Java 21:**
```powershell
# 下载安装或使用 scoop
scoop install openjdk21

# 设置环境变量（系统属性 → 高级 → 环境变量）
JAVA_HOME=C:\Program Files\Java\jdk-21
```

**Node.js:**
```powershell
# 使用 scoop 安装
scoop install nodejs

# 或从官网下载安装包
# https://nodejs.org/
```

**PostgreSQL:**
```powershell
# 使用 scoop 安装
scoop install postgresql

# 或下载安装包
# https://www.postgresql.org/download/windows/
```

**Maven:**
```powershell
# 使用 scoop 安装
scoop install maven

# 验证安装
mvn --version
```

### macOS 安装

**Java 21:**
```bash
brew install openjdk@21

# 设置 JAVA_HOME (添加到 ~/.zshrc)
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home
```

**Node.js:**
```bash
brew install node
```

**PostgreSQL:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Maven:**
```bash
brew install maven
```

## 数据库初始化

### 创建数据库

```bash
# PostgreSQL 命令行
psql -U postgres

# 创建数据库
CREATE DATABASE layer_editor;

# Mac本地开发可能不需要密码
# Windows可能需要设置postgres用户密码
```

### Flyway自动迁移

后端启动时，Flyway会自动执行迁移脚本：
- 创建用户表 `app_user`
- 创建文档表 `editor_document`
- 创建素材表 `editor_asset`
- 创建版本表 `editor_document_revision`
- 插入默认用户 `editor/editor`

## 启动步骤

### 方式一：分别启动

**1. 启动后端**

```bash
cd backend

# Windows
mvn spring-boot:run

# Mac (需设置JAVA_HOME)
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home
mvn spring-boot:run
```

后端启动成功后访问: http://localhost:8080

**2. 启动前端**

```bash
cd frontend

# 安装依赖 (首次运行)
npm install

# 启动开发服务器
npm run dev
```

前端启动成功后访问: http://localhost:5173

### 方式二：使用启动脚本

**Windows (start-windows.bat):**
```batch
@echo off
echo Starting Layer Editor...

cd backend
start cmd /k "mvn spring-boot:run"

timeout /t 10

cd frontend
start cmd /k "npm run dev"

echo Services starting...
echo Backend: http://localhost:8080
echo Frontend: http://localhost:5173
```

**Mac (start-mac.sh):**
```bash
#!/bin/bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.10/libexec/openjdk.jdk/Contents/Home

cd backend
mvn spring-boot:run &

sleep 10

cd frontend
npm run dev &

echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:5173"
```

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 (Vite) | 5173-5179 | 开发服务器，支持多端口 |
| 后端 (Spring Boot) | 8080 | API服务 |
| PostgreSQL | 5432 | 数据库 |

## AI功能配置

### 火山引擎凭证

AI图像处理需要配置火山引擎API凭证：

1. 注册火山引擎账号：https://www.volcengine.com/
2. 开通视觉智能服务
3. 创建 Access Key：https://console.volcengine.com/iam/keymanage/
4. 设置环境变量：

**Windows:**
```powershell
# 临时设置（当前终端）
$env:VOLC_ACCESS_KEY="your_access_key"
$env:VOLC_SECRET_KEY="your_secret_key"

# 永久设置（系统环境变量）
setx VOLC_ACCESS_KEY "your_access_key"
setx VOLC_SECRET_KEY "your_secret_key"
```

**Mac/Linux:**
```bash
# 临时设置
export VOLC_ACCESS_KEY=your_access_key
export VOLC_SECRET_KEY=your_secret_key

# 永久设置（添加到 ~/.zshrc 或 ~/.bashrc）
echo 'export VOLC_ACCESS_KEY=your_access_key' >> ~/.zshrc
echo 'export VOLC_SECRET_KEY=your_secret_key' >> ~/.zshrc
```

### AI功能状态检查

访问 http://localhost:8080/api/ai/status 查看：

```json
{
  "configured": true,
  "provider": "ByteDance Volcengine",
  "features": ["matting", "outpainting", "inpainting", "super-resolution"],
  "message": "AI features are available"
}
```

未配置凭证时，`configured: false`，AI按钮显示禁用状态。

## 认证说明

系统使用 HTTP Basic 认证：

| 参数 | 默认值 | 环境变量 |
|------|--------|----------|
| 用户名 | editor | `APP_AUTH_USERNAME` |
| 密码 | editor | `APP_AUTH_PASSWORD` |

浏览器访问时会弹出认证对话框，输入用户名密码即可。

## 常见问题

### 端口被占用

**Windows:**
```powershell
# 查找占用进程
netstat -ano | findstr :8080
netstat -ano | findstr :5173

# 终止进程
taskkill /PID <PID> /F
```

**Mac:**
```bash
# 查找占用进程
lsof -i :8080
lsof -i :5173

# 终止进程
kill -9 <PID>
```

### Java版本问题

确保使用 Java 21：

```bash
java --version
# 应显示 openjdk version "21.x.x"

# 如果版本不对，检查 JAVA_HOME
echo $JAVA_HOME      # Mac/Linux
echo %JAVA_HOME%     # Windows
```

### Maven命令找不到

Windows请使用 `mvn` 而不是 `mvnw`：

```powershell
# 正确
mvn spring-boot:run

# 错误（mvnw可能有兼容问题）
.\mvnw spring-boot:run
```

如果 `mvn` 命令不存在，安装Maven：
```powershell
scoop install maven
```

### 数据库连接失败

检查配置文件 `backend/src/main/resources/application-windows.yml`：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/layer_editor
    username: postgres
    password: your_password
```

确保：
- PostgreSQL服务已启动
- 数据库 `layer_editor` 已创建
- 用户名密码正确

### CORS 403错误

后端已配置支持多端口：
- localhost:5173 ~ 5179
- localhost:3000

如果仍出现CORS错误，检查前端端口是否在范围内。

### Flyway迁移失败

```bash
# 查看迁移状态
cd backend
mvn flyway:info

# 手动执行迁移
mvn flyway:migrate

# 清理并重建（开发环境）
mvn flyway:clean flyway:migrate
```

### 前端依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules
npm install
```

## 工具栏功能

| 按钮 | 功能 | 说明 |
|------|------|------|
| Home | 返回列表 | 返回文档列表页 |
| ➕ | 添加矩形 | 添加矩形形状 |
| A | 添加文本 | 添加文本图层 |
| 📐 | 添加多边形 | 添加多边形形状 |
| 🖼️ | 本地图片 | 从本地选择图片 |
| 📦 | 素材库 | 从素材库选择 |
| ⭐ | SVG形状 | SVG形状库 |
| ↩️↪️ | 撤销/重做 | 历史操作 |
| ↔️ | 对齐 | 对齐工具 |
| 📁 | 分组/取消 | 图层分组 |
| 🔍 | 缩放 | 缩放工具 |
| 💾 | 保存 | 保存文档 |
| ⬇️ | 导出 | 导出图片 |

### AI工具（需配置凭证）

| 功能 | PropertyPanel按钮 | 说明 |
|------|-------------------|------|
| 抠图 | 🎯 Matting | 去除背景 |
| 扩图 | 📐 Outpainting | 扩展边界 |
| 消除 | 🧹 Inpainting | 消除杂物 |
| 增强 | ⚡ Super Resolution | 画质提升 |

## 导出选项

点击导出按钮后可选择：

| 选项 | 说明 |
|------|------|
| Full Canvas | 整个画布导出 |
| Selected Layers | 仅选中图层 |
| All Layers Separately | 分层导出 |

| 格式 | 说明 |
|------|------|
| PNG | 无损，支持透明 |
| JPEG | 更小文件 |
| WebP | 现代格式 |
| PDF | 文档格式 |
| SVG | 矢量格式 |

| 分辨率 | 说明 |
|------|------|
| 1x | 标准分辨率 |
| 2x | 高清 |
| 3x | 超高清 |
| 4x | 最高分辨率 |

## 更多文档

- [README.md](README.md) - 项目概述
- [LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md](LAYER_EDITOR_SINGLE_USER_ARCHITECTURE.md) - 架构设计