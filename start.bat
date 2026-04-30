@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 加载 .env 文件
if exist "%~dp0.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%~dp0.env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

echo ======================================
echo   图层编辑器 - 一键启动 ^(Windows^)
echo ======================================

REM ========== 1. JDK 21 检测 ==========
echo [1/5] 检测 JDK 21...

java -version 2>&1 | findstr /C:"version ""21" >nul 2>&1
if %errorlevel%==0 (
    echo       JDK 21 已就绪
    goto :jdk_ok
)

REM 搜索候选 JDK 21 路径
set "JDK_FOUND="
for %%p in (
    "D:\Program Files (x86)\Java\jdk-21"
    "C:\Program Files\Java\jdk-21"
    "C:\Program Files\Eclipse Adoptium\jdk-21.0.6-hotspot"
    "C:\Program Files\Eclipse Adoptium\jdk-21.0.5-hotspot"
    "C:\Program Files\Java\jdk-21.0.6"
    "C:\Program Files\Java\jdk-21.0.5"
) do (
    if exist %%p\bin\java.exe (
        set "JAVA_HOME=%%p"
        set "PATH=%%p\bin;!PATH!"
        set "JDK_FOUND=1"
        echo       自动设置 JAVA_HOME=%%p
        goto :jdk_ok
    )
)

echo       [错误] 未找到 JDK 21！
echo       下载: https://adoptium.net/ 选择 JDK 21 LTS
pause
exit /b 1

:jdk_ok

REM ========== 2. PostgreSQL 检测和启动 ==========
echo [2/5] 检测 PostgreSQL...

set "PSQL_CMD="
set "PG_CTL_CMD="
set "PG_DATA="

REM 搜索 psql.exe
for %%p in (
    "D:\PostgreSQL\pgsql\bin"
    "C:\Program Files\PostgreSQL\17\bin"
    "C:\Program Files\PostgreSQL\16\bin"
) do (
    if exist %%p\psql.exe (
        set "PSQL_CMD=%%p\psql.exe"
        set "PG_CTL_CMD=%%p\pg_ctl.exe"
        echo       找到 PostgreSQL: %%p
        goto :pg_found
    )
)

where psql >nul 2>&1
if %errorlevel%==0 (
    for /f "tokens=*" %%i in ('where psql') do (
        set "PSQL_CMD=%%i"
        for /f "tokens=*" %%j in ('where pg_ctl') do set "PG_CTL_CMD=%%j"
        echo       找到 PostgreSQL in PATH
        goto :pg_found
    )
)

echo       [错误] 未找到 PostgreSQL！
echo       下载: https://www.postgresql.org/download/windows/
pause
exit /b 1

:pg_found

REM 检查 5432 端口是否在监听
netstat -an 2>nul | findstr ":5432 .*LISTEN" >nul 2>&1
if %errorlevel%==0 (
    echo       PostgreSQL 已运行 ^(端口 5432^)
    goto :pg_ok
)

REM 尝试自动启动 PostgreSQL
echo       PostgreSQL 未运行，尝试自动启动...

REM 查找 data 目录
for %%d in (
    "D:\PostgreSQL\data"
    "C:\Program Files\PostgreSQL\17\data"
    "C:\Program Files\PostgreSQL\16\data"
) do (
    if exist %%d\PG_VERSION (
        set "PG_DATA=%%d"
        goto :pg_start
    )
)

echo       [错误] 找不到 PostgreSQL data 目录
echo       请手动启动 PostgreSQL 服务
pause
exit /b 1

:pg_start
echo       启动 PostgreSQL ^(data: !PG_DATA!^)...
"!PG_CTL_CMD!" start -D "!PG_DATA!" -l "%TEMP%\postgresql.log" 2>nul
timeout /t 3 /nobreak >nul

REM 再次检查端口
netstat -an 2>nul | findstr ":5432 .*LISTEN" >nul 2>&1
if %errorlevel%==0 (
    echo       PostgreSQL 已启动
    goto :pg_ok
)

REM 尝试 Windows 服务方式
echo       尝试通过 Windows 服务启动...
powershell.exe -Command "Get-Service -Name 'postgresql*' | Where-Object {$_.Status -ne 'Running'} | Start-Service" 2>nul
timeout /t 3 /nobreak >nul

netstat -an 2>nul | findstr ":5432 .*LISTEN" >nul 2>&1
if %errorlevel%==0 (
    echo       PostgreSQL 服务已启动
    goto :pg_ok
)

echo       [错误] 无法自动启动 PostgreSQL
echo       请手动启动后重试
pause
exit /b 1

:pg_ok

REM ========== 3. 数据库检测和创建 ==========
echo [3/5] 检测数据库...

set "PGPASSWORD=%DB_PASSWORD%"
if "%PGPASSWORD%"=="" set "PGPASSWORD=postgres"

set "DB_USER=%DB_USERNAME%"
if "%DB_USER%"=="" set "DB_USER=postgres"

"!PSQL_CMD!" -h localhost -p 5432 -U %DB_USER% -lqt 2>nul | findstr /C:"layer_editor" >nul 2>&1
if %errorlevel%==0 (
    echo       数据库 layer_editor 已存在
    goto :db_ok
)

echo       创建数据库 layer_editor...
"!PSQL_CMD!" -h localhost -p 5432 -U %DB_USER% -c "CREATE DATABASE layer_editor;" 2>nul
if %errorlevel%==0 (
    echo       数据库创建成功
) else (
    echo       [警告] 数据库可能需要手动创建
    echo       PGPASSWORD=postgres createdb -U postgres layer_editor
)

:db_ok

REM ========== 4. 前端依赖检测 ==========
echo [4/5] 检测前端依赖...
if not exist "%~dp0frontend\node_modules" (
    echo       安装前端依赖^(首次运行^)...
    cd /d "%~dp0frontend"
    call npm install
    if %errorlevel% neq 0 (
        echo       [错误] npm install 失败
        pause
        exit /b 1
    )
)
echo       前端依赖已就绪

REM ========== 5. 启动服务 ==========
echo [5/5] 启动服务...

REM 检查端口冲突
netstat -an 2>nul | findstr ":8080 .*LISTEN" >nul 2>&1
if %errorlevel%==0 (
    echo       后端已在运行 ^(端口 8080^)
    goto :check_frontend
)

echo       启动后端 ^(Spring Boot^)...
start "Layer Editor - Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run -Dspring-boot.run.profiles=windows -DskipTests"

echo       等待后端启动...
set /a WAIT=0
:wait_backend
if !WAIT! geq 60 (
    echo       [错误] 后端启动超时
    pause
    exit /b 1
)
curl -sf http://localhost:8080/api/documents >nul 2>&1
if %errorlevel%==0 (
    echo       后端启动成功
    goto :check_frontend
)
timeout /t 1 /nobreak >nul
set /a WAIT+=1
goto :wait_backend

:check_frontend
curl -sf http://localhost:5173 >nul 2>&1
if %errorlevel%==0 (
    echo       前端已在运行 ^(端口 5173^)
    goto :done
)

echo       启动前端 ^(Vite^)...
start "Layer Editor - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:done
echo.
echo ======================================
echo   启动完成！
echo   前端: http://localhost:5173
echo   后端: http://localhost:8080
echo ======================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5173
