# 图层编辑器 Windows 启动指南

## 环境要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| **Java JDK** | 21 | 后端运行环境 |
| **Node.js** | 18+ | 前端构建工具 |
| **PostgreSQL** | 16 | 数据库 |
| **Maven** | 3.9+ | Java 项目构建（后端已包含 Maven Wrapper，可不单独安装） |
| **Git** | 最新 | 版本控制 |

---

## 一、安装依赖软件

### 1. 安装 Java 21

推荐使用 **Adoptium (Eclipse Temurin)**：

1. 访问 https://adoptium.net/
2. 选择 **JDK 21 - LTS**，操作系统选 **Windows**，架构选 **x64**
3. 下载 `.msi` 安装包，双击安装
4. 安装时勾选 **"Set JAVA_HOME variable"** 和 **"Add to PATH"**

安装完成后打开 **命令提示符** 或 **PowerShell** 验证：

```cmd
java --version
# 应输出类似：openjdk version "21.0.x"
```

如果 `java` 命令不可用，手动设置环境变量：

```cmd
# 方法1：命令行临时设置（当前窗口有效）
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%

# 方法2：系统设置（永久）
# 右键"此电脑" → 属性 → 高级系统设置 → 环境变量
# 新建系统变量 JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot
# 编辑 Path，添加 %JAVA_HOME%\bin
```

### 2. 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 **LTS 版本**（推荐 20.x 或更高）
3. 双击 `.msi` 安装包，保持默认选项
4. 安装完成后验证：

```cmd
node --version
npm --version
```

### 3. 安装 PostgreSQL

**方法一：官方安装包**

1. 访问 https://www.postgresql.org/download/windows/
2. 下载并运行安装程序
3. 安装过程中设置：
   - 安装路径：保持默认
   - **超级用户密码**：设为 `postgres`（与配置文件一致）
   - 端口：`5432`（默认）
   - 区域设置：保持默认
4. 安装完成后，Stack Builder 可选安装（不需要）

**方法二：使用 Docker Desktop**

1. 安装 [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. 启动 Docker Desktop
3. 在项目根目录创建 `docker-compose.yml`（见下方）

### 4. 安装 Git

1. 访问 https://git-scm.com/download/win
2. 下载并安装，保持默认选项
3. 验证：

```cmd
git --version
```

---

## 二、配置数据库

### 方法一：已安装 PostgreSQL 服务

打开 **SQL Shell (psql)** 或 **pgAdmin**，执行：

```sql
-- 连接 PostgreSQL（密码为安装时设置的 postgres）
-- 创建数据库
CREATE DATABASE layer_editor;

-- 验证
\l
```

或者用命令行：

```cmd
# 设置密码环境变量，避免每次输入
set PGPASSWORD=postgres

# 创建数据库
createdb -U postgres layer_editor
```

确认 `backend/src/main/resources/application.yml` 中的数据库配置正确：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/layer_editor
    username: postgres
    password: postgres        # 改为你安装时设置的密码
```

### 方法二：使用 Docker

在项目根目录创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    container_name: layer_editor_db
    environment:
      POSTGRES_DB: layer_editor
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

启动：

```cmd
docker-compose up -d
```

停止：

```cmd
docker-compose down
```

---

## 三、克隆项目

```cmd
cd E:\
git clone https://github.com/0704681032/layereditor.git
cd layereditor
```

---

## 四、启动后端

```cmd
cd E:\layereditor\backend

# 首次运行需要下载依赖，较慢（约 2-5 分钟）
# 使用项目自带的 Maven Wrapper，无需单独安装 Maven
mvnw.cmd spring-boot:run

# 如果已单独安装 Maven，也可以用：
# mvn spring-boot:run
```

后端启动成功后，控制台会显示：

```
Started EditorApplication in x.xx seconds
```

验证后端运行：

```cmd
curl http://localhost:8080/api/documents
```

> **注意：** Flyway 会自动执行数据库迁移脚本（建表），无需手动建表。首次启动时如果报数据库连接错误，请确认 PostgreSQL 服务正在运行且 `layer_editor` 数据库已创建。

---

## 五、启动前端

**新开一个命令提示符窗口**（后端需要保持运行）：

```cmd
cd E:\layereditor\frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

启动成功后控制台会显示：

```
VITE vx.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

浏览器访问 **http://localhost:5173** 即可使用。

---

## 六、一键启动脚本

### PowerShell 脚本 `start.ps1`

在项目根目录创建以下文件：

```powershell
# start.ps1 - 图层编辑器一键启动脚本

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  图层编辑器 - 启动中..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# 检查 PostgreSQL 服务状态
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -ne "Running") {
        Write-Host "[1/3] 启动 PostgreSQL 服务..." -ForegroundColor Yellow
        Start-Service $pgService.Name
    } else {
        Write-Host "[1/3] PostgreSQL 服务已运行 ✓" -ForegroundColor Green
    }
} else {
    Write-Host "[1/3] 警告：未找到 PostgreSQL 服务，请确认已安装" -ForegroundColor Red
    Write-Host "       如果使用 Docker，请手动运行: docker-compose up -d" -ForegroundColor Yellow
}

# 启动后端
Write-Host "[2/3] 启动后端 (Spring Boot)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d E:\layereditor\backend && mvnw.cmd spring-boot:run" -WindowTitle "Layer Editor - Backend"

# 等待后端启动
Write-Host "       等待后端启动（约 15 秒）..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 启动前端
Write-Host "[3/3] 启动前端 (Vite)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d E:\layereditor\frontend && npm run dev" -WindowTitle "Layer Editor - Frontend"

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  启动完成！" -ForegroundColor Green
Write-Host "  后端: http://localhost:8080" -ForegroundColor White
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "按任意键打开浏览器..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"
```

运行方式：右键 `start.ps1` → **使用 PowerShell 运行**

或者在 PowerShell 中：

```powershell
cd E:\layereditor
.\start.ps1
```

> 如果遇到执行策略限制，先执行：
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

### 批处理脚本 `start.bat`

如果 PowerShell 不可用，可使用 `.bat` 脚本：

```batch
@echo off
chcp 65001 >nul
echo ======================================
echo   图层编辑器 - 启动中...
echo ======================================

echo [1/3] 启动后端 (Spring Boot)...
start "Layer Editor - Backend" cmd /k "cd /d E:\layereditor\backend && mvnw.cmd spring-boot:run"

echo       等待后端启动（约 15 秒）...
timeout /t 15 /nobreak >nul

echo [2/3] 启动前端 (Vite)...
start "Layer Editor - Frontend" cmd /k "cd /d E:\layereditor\frontend && npm run dev"

echo.
echo ======================================
echo   启动完成！
echo   后端: http://localhost:8080
echo   前端: http://localhost:5173
echo ======================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5173
```

双击 `start.bat` 即可运行。

---

## 七、常见问题

### 1. `mvnw.cmd` 无法运行

```
'mvw' 不是内部或外部命令
```

**解决：** 确保在 `backend` 目录下执行命令。如果项目没有 `mvnw.cmd`，需安装 Maven：

1. 下载 https://maven.apache.org/download.cgi (Binary zip)
2. 解压到 `C:\apache-maven-3.9.x`
3. 添加环境变量 `MAVEN_HOME=C:\apache-maven-3.9.x`
4. 添加 `%MAVEN_HOME%\bin` 到 `PATH`
5. 使用 `mvn spring-boot:run` 替代 `mvnw.cmd spring-boot:run`

### 2. 端口被占用

```cmd
# 查找占用端口的进程
netstat -ano | findstr :8080
netstat -ano | findstr :5173

# 终止进程（PID 为上一步查到的数字）
taskkill /PID <PID> /F
```

### 3. Java 版本不对

```cmd
java --version
```

如果版本不是 21，修改环境变量：

```cmd
# 查看当前 JAVA_HOME
echo %JAVA_HOME%

# 修改为 JDK 21 路径（根据实际安装路径调整）
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
```

### 4. 数据库连接失败

检查清单：

1. PostgreSQL 服务是否启动：
   ```cmd
   # 检查服务状态
   sc query postgresql-x64-16

   # 或查看端口监听
   netstat -ano | findstr :5432
   ```

2. 数据库是否已创建：
   ```cmd
   set PGPASSWORD=postgres
   psql -U postgres -c "\l"
   ```

3. 用户名/密码是否匹配 `application.yml` 中的配置

### 5. npm install 失败

```cmd
# 清除缓存重试
cd E:\layereditor\frontend
rd /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

如果网络较慢，可使用国内镜像：

```cmd
npm config set registry https://registry.npmmirror.com
npm install
```

### 6. Flyway 迁移失败

如果数据库表已存在但 Flyway 报错，可能是之前手动建过表：

```sql
-- 连接数据库后，清除并重建（注意：会删除所有数据！）
DROP DATABASE layer_editor;
CREATE DATABASE layer_editor;
```

然后重新启动后端，Flyway 会自动建表。

---

## 八、生产构建

### 前端构建

```cmd
cd E:\layereditor\frontend
npm run build
```

构建产物在 `frontend/dist/` 目录，可部署到 Nginx 或其他 Web 服务器。

### 后端构建

```cmd
cd E:\layereditor\backend
mvnw.cmd package -DskipTests
```

生成的 JAR 文件在 `backend/target/` 目录，运行：

```cmd
java -jar backend/target/layer-editor-0.1.0-SNAPSHOT.jar
```

---

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 (Vite) | 5173 | 开发服务器，自动代理 API 到后端 |
| 后端 (Spring Boot) | 8080 | REST API 服务 |
| PostgreSQL | 5432 | 数据库 |

## 项目结构

```
layereditor/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/          # Java 源码
│   ├── src/main/resources/     # 配置文件和 SQL 迁移
│   ├── mvnw.cmd                # Maven Wrapper (Windows)
│   └── pom.xml                 # Maven 依赖配置
├── frontend/                   # React 前端
│   ├── src/                    # TypeScript 源码
│   ├── package.json            # npm 依赖配置
│   └── vite.config.ts          # Vite 开发服务器配置
├── docker-compose.yml          # Docker 数据库配置（可选）
├── start.ps1                   # PowerShell 一键启动脚本
├── start.bat                   # 批处理一键启动脚本
└── STARTUP_WINDOWS.md          # 本文档
```
