#!/bin/bash
# start.sh - 图层编辑器 Mac/Linux 启动脚本

set -e

echo "======================================"
echo "  图层编辑器 - 启动中..."
echo "======================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查 PostgreSQL 是否运行
check_postgres() {
    if pg_isready -q 2>/dev/null; then
        echo "${GREEN}[1/4] PostgreSQL 已运行${NC}"
        return 0
    else
        echo "${RED}[1/4] PostgreSQL 未运行，请先启动数据库服务${NC}"
        echo "${YELLOW}       brew services start postgresql@16${NC}"
        echo "${YELLOW}       或: pg_ctl -D /usr/local/var/postgres start${NC}"
        return 1
    fi
}

# 检查并创建数据库
setup_database() {
    # 检查 postgres 角色是否存在
    if ! psql -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgres'" 2>/dev/null | grep -q 1; then
        echo "${YELLOW}       创建 postgres 角色...${NC}"
        psql -d postgres -c "CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' SUPERUSER;" 2>/dev/null || true
    fi

    # 检查数据库是否存在
    if ! psql -lqt 2>/dev/null | grep -q "layer_editor"; then
        echo "${YELLOW}       创建 layer_editor 数据库...${NC}"
        createdb -U postgres layer_editor 2>/dev/null || \
        psql -d postgres -c "CREATE DATABASE layer_editor OWNER postgres;" 2>/dev/null || true
    fi
    echo "${GREEN}       数据库已就绪${NC}"
}

# 检查前端依赖
check_frontend_deps() {
    if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
        echo "${YELLOW}[2/4] 安装前端依赖...${NC}"
        cd "$SCRIPT_DIR/frontend" && npm install
    else
        echo "${GREEN}[2/4] 前端依赖已安装${NC}"
    fi
}

# 启动后端
start_backend() {
    echo "${YELLOW}[3/4] 启动后端 (Spring Boot)...${NC}"

    # 检查端口是否被占用
    if lsof -i :8080 >/dev/null 2>&1; then
        echo "${RED}       端口 8080 已被占用，请先关闭${NC}"
        echo "${YELLOW}       kill $(lsof -t -i :8080)${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR/backend"
    # 使用 nohup 后台运行
    nohup ./mvnw spring-boot:run > /tmp/layer-editor-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "       后端 PID: $BACKEND_PID"
    echo "${YELLOW}       等待后端启动（约 15-30 秒）...${NC}"

    # 等待后端启动
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/documents >/dev/null 2>&1; then
            echo "${GREEN}       后端启动成功${NC}"
            return 0
        fi
        sleep 1
        printf "\r       等待中... %d秒" $i
    done
    echo "${RED}       后端启动超时，请检查日志: /tmp/layer-editor-backend.log${NC}"
    return 1
}

# 启动前端
start_frontend() {
    echo ""
    echo "${YELLOW}[4/4] 启动前端 (Vite)...${NC}"

    # 检查端口是否被占用
    if lsof -i :5173 >/dev/null 2>&1; then
        echo "${RED}       端口 5173 已被占用，请先关闭${NC}"
        echo "${YELLOW}       kill $(lsof -t -i :5173)${NC}"
        return 1
    fi

    cd "$SCRIPT_DIR/frontend"
    nohup npm run dev > /tmp/layer-editor-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "       前端 PID: $FRONTEND_PID"

    # 等待前端启动
    for i in {1..10}; do
        if curl -s http://localhost:5173 >/dev/null 2>&1; then
            echo "${GREEN}       前端启动成功${NC}"
            return 0
        fi
        sleep 1
    done
    echo "${RED}       前端启动超时，请检查日志: /tmp/layer-editor-frontend.log${NC}"
    return 1
}

# 主流程
main() {
    check_postgres || exit 1
    setup_database
    check_frontend_deps
    start_backend || exit 1
    start_frontend || exit 1

    echo ""
    echo "======================================"
    echo "${GREEN}  启动完成！${NC}"
    echo "  后端: http://localhost:8080"
    echo "  前端: http://localhost:5173"
    echo "======================================"
    echo ""
    echo "日志文件:"
    echo "  后端: /tmp/layer-editor-backend.log"
    echo "  前端: /tmp/layer-editor-frontend.log"
    echo ""

    # 打开浏览器
    if command -v open >/dev/null 2>&1; then
        open http://localhost:5173
    elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open http://localhost:5173
    fi
}

main