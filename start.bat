@echo off
chcp 65001 >nul
echo ======================================
echo   图层编辑器 - 启动中...
echo ======================================

echo [1/2] 启动后端 (Spring Boot)...
start "Layer Editor - Backend" cmd /k "cd /d %~dp0backend && mvnw.cmd spring-boot:run"

echo       等待后端启动（约 15 秒）...
timeout /t 15 /nobreak >nul

echo [2/2] 启动前端 (Vite)...
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
