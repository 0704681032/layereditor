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
        Write-Host "[1/3] PostgreSQL 服务已运行" -ForegroundColor Green
    }
} else {
    Write-Host "[1/3] 警告：未找到 PostgreSQL 服务，请确认已安装" -ForegroundColor Red
    Write-Host "       如果使用 Docker，请手动运行: docker-compose up -d" -ForegroundColor Yellow
}

# 启动后端
Write-Host "[2/3] 启动后端 (Spring Boot)..." -ForegroundColor Yellow
$backendDir = Join-Path $PSScriptRoot "backend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$backendDir`" && mvnw.cmd spring-boot:run" -WindowTitle "Layer Editor - Backend"

# 等待后端启动
Write-Host "       等待后端启动（约 15 秒）..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# 启动前端
Write-Host "[3/3] 启动前端 (Vite)..." -ForegroundColor Yellow
$frontendDir = Join-Path $PSScriptRoot "frontend"
Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd /d `"$frontendDir`" && npm run dev" -WindowTitle "Layer Editor - Frontend"

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
