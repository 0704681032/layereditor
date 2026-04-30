# 图层编辑器 Mac 启动指南

## 环境要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| **Java JDK** | 21+ | 后端运行环境 |
| **Node.js** | 18+ | 前端构建工具 |
| **PostgreSQL** | 16 | 数据库（本地安装） |
| **Maven** | 3.9+ | Java 项目构建 |
| **Git** | 最新 | 版本控制 |

---

## 一、安装依赖软件

### 1. 安装 Java 21（必须！）

**重要：本项目必须使用 JDK 21，其他版本（如 JDK 22）会导致 Lombok 编译失败。**

推荐使用 **Homebrew**：

```bash
brew install openjdk@21

# 创建符号链接
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-21.jdk

# 验证
/opt/homebrew/opt/openjdk@21/bin/java --version
# 应输出：openjdk version "21.0.x"
```

或手动下载 [Adoptium](https://adoptium.net/) 安装。

**检查当前默认 Java 版本：**

```bash
java --version
```

如果显示的不是 JDK 21，需要设置 `JAVA_HOME`：

```bash
# 临时设置（仅当前终端有效）
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home

# 或永久设置（添加到 ~/.zshrc 或 ~/.bash_profile）
echo 'export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home' >> ~/.zshrc
source ~/.zshrc
```

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

### 4. 安装 Maven

```bash
brew install maven

# 验证
mvn --version
```

### 5. 安装 Git

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
2. 创建 `layer_editor` 数据库（如果不存在）
3. 安装前端依赖（如果需要）
4. 启动后端（使用 `mac` profile）
5. 启动前端
6. 打开浏览器

---

## 四、手动启动

### 启动后端

```bash
cd backend

# 设置 JAVA_HOME（如果默认不是 JDK 21）
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home

# 启动后端（使用 mac profile）
mvn spring-boot:run -Dspring-boot.run.profiles=mac
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

项目使用 **Spring Profile** 实现环境差异兼容：

| Profile | 配置文件 | 适用环境 | 数据库用户 |
|---------|----------|----------|------------|
| `mac` | `application-mac.yml` | Mac 本地安装 | 当前系统用户（无需密码） |
| `windows` | `application-windows.yml` | Windows Docker | `postgres` |

**Mac 配置** (`application-mac.yml`)：
```yaml
spring:
  datasource:
    username: ${DB_USERNAME:${USER:jyy}}  # 默认使用系统用户名
    password: ${DB_PASSWORD:}             # 本地安装通常无需密码
```

**Windows 配置** (`application-windows.yml`)：
```yaml
spring:
  datasource:
    username: ${DB_USERNAME:postgres}     # Docker 默认用户
    password: ${DB_PASSWORD:postgres}     # Docker 默认密码
```

### 自定义配置

可通过环境变量覆盖默认配置：

```bash
# Mac 自定义用户名
export DB_USERNAME=myuser
export DB_PASSWORD=mypassword
./start.sh
```

```cmd
# Windows 自定义配置
set DB_USERNAME=myuser
set DB_PASSWORD=mypassword
start.bat
```

启动脚本已自动指定 profile，无需手动配置。

---

## 六、常见问题

### 1. JDK 版本不兼容

**症状：** 编译时报错 `java.lang.ExceptionInInitializerError: com.sun.tools.javac.code.TypeTag`

**原因：** 使用了 JDK 22 或其他非 JDK 21 版本，Lombok 不兼容。

**解决方案：**

```bash
# 检查当前 Java 版本
java --version

# 如果不是 JDK 21，设置 JAVA_HOME
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home

# 重新编译
cd backend
mvn clean compile -DskipTests
```

### 2. PostgreSQL 未运行

```bash
# 启动服务
brew services start postgresql@16

# 或手动启动
pg_ctl -D /usr/local/var/postgresql@16 start
```

### 3. 端口被占用

**症状：** 后端启动失败，提示 `Port 8080 was already in use`

**原因：** 其他项目（如 gaoding）或其他进程占用了端口。

**解决方案：**

```bash
# 查看占用 8080 端口的进程
lsof -i :8080

# 终止占用进程
kill $(lsof -t -i :8080)

# 或指定具体 PID
kill <PID>

# 然后重新启动后端
./start.sh
```

### 4. Maven 未安装

```bash
brew install maven
```

### 5. npm install 网络慢

```bash
npm config set registry https://registry.npmmirror.com
npm install
```

### 6. 前端依赖缺失

**症状：** 页面显示 `Failed to resolve import "jszip"`

**解决方案：**

```bash
cd frontend
npm install jszip
# 或重新安装所有依赖
npm install
```

### 7. 数据库连接失败

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