# 图层编辑器 Mac 启动指南

## 环境要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| **Java JDK** | 21 | 后端运行环境 |
| **Node.js** | 18+ | 前端构建工具 |
| **PostgreSQL** | 16 | 数据库（本地安装） |
| **Git** | 最新 | 版本控制 |

---

## 一、安装依赖软件

### 1. 安装 Java 21

推荐使用 **Homebrew**：

```bash
brew install openjdk@21

# 创建符号链接
sudo ln -sfn /usr/local/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# 验证
java --version
# 应输出：openjdk version "21.0.x"
```

或手动下载 [Adoptium](https://adoptium.net/) 安装。

### 2. 安装 Node.js

```bash
brew install node

# 验证
node --version
npm --version
```

### 3. 安装 PostgreSQL

```bash
brew install postgresql@16
brew services start postgresql@16

# 验证
pg_isready
# 应输出：accepting connections
```

### 4. 安装 Git

```bash
brew install git
git --version
```

---

## 二、克隆项目

```bash
cd ~/Documents
git clone https://github.com/0704681032/layereditor.git
cd layereditor
```

---

## 三、一键启动

```bash
./start.sh
```

启动脚本会自动：
1. 检查 PostgreSQL 服务状态
2. 创建 `postgres` 角色（如果不存在）
3. 创建 `layer_editor` 数据库（如果不存在）
4. 安装前端依赖（如果需要）
5. 启动后端和前端
6. 打开浏览器

---

## 四、手动启动

### 启动后端

```bash
cd backend
./mvnw spring-boot:run
```

首次运行会下载 Maven 依赖，约 2-5 分钟。

### 启动前端

新开终端窗口：

```bash
cd frontend
npm install      # 首次运行
npm run dev
```

---

## 五、数据库配置

Mac 本地安装的 PostgreSQL 默认用户是当前系统用户名（如 `jyy`）。

启动脚本会自动创建 `postgres` 角色，确保与配置文件一致。

如果需要手动配置：

```bash
# 创建 postgres 角色
psql -d postgres -c "CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;"

# 创建数据库
createdb -U postgres layer_editor
```

配置文件 `backend/src/main/resources/application.yml`：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/layer_editor
    username: postgres
    password: postgres
```

---

## 六、常见问题

### 1. PostgreSQL 未运行

```bash
# 启动服务
brew services start postgresql@16

# 或手动启动
pg_ctl -D /usr/local/var/postgresql@16 start
```

### 2. 端口被占用

```bash
# 查找并终止占用进程
lsof -i :8080
kill <PID>

lsof -i :5173
kill <PID>
```

### 3. Maven Wrapper 无执行权限

```bash
chmod +x backend/mvnw
```

### 4. npm install 网络慢

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### 5. 数据库连接失败

检查 PostgreSQL 监听状态：

```bash
pg_isready -h localhost -p 5432
```

---

## 七、停止服务

```bash
# 终止后端
kill $(lsof -t -i :8080)

# 终止前端
kill $(lsof -t -i :5173)
```

---

## 端口说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 (Vite) | 5173 | 开发服务器 |
| 后端 (Spring Boot) | 8080 | REST API |
| PostgreSQL | 5432 | 数据库 |

---

## 项目结构

```
layereditor/
├── backend/                # Spring Boot 后端
├── frontend/               # React 前端
├── start.sh                # Mac/Linux 启动脚本
├── start.bat               # Windows 启动脚本
├── start.ps1               # Windows PowerShell 脚本
├── STARTUP_MAC.md          # 本文档
└── STARTUP_WINDOWS.md      # Windows 启动文档
```