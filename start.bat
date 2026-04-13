@echo off
chcp 65001 >nul

REM Load .env file if present
if exist "%~dp0.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%~dp0.env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

echo ======================================
echo   图层编辑器 - 启动中...
echo ======================================

echo [1/3] 启动后端 (Spring Boot)...
start "Layer Editor - Backend" cmd /k "cd /d %~dp0backend && mvn spring-boot:run -Dspring-boot.run.profiles=windows"

echo       等待后端启动（约 15 秒）...
timeout /t 15 /nobreak >nul

echo [2/3] 启动前端 (Vite)...
start "Layer Editor - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

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
