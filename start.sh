#!/bin/bash
# start.sh - 图层编辑器一键启动脚本（Mac / Windows Git Bash 通用）
# 自动检测：JDK 21、PostgreSQL、数据库、前端依赖
# 使用方法：bash start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 加载 .env 文件
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a; source "$SCRIPT_DIR/.env"; set +a
fi

# 颜色定义
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

# 检测操作系统
detect_os() {
    case "$(uname -s)" in
        Darwin*) echo "mac" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        Linux*) echo "linux" ;;
        *) echo "unknown" ;;
    esac
}

OS=$(detect_os)
echo "${CYAN}======================================"
echo "  图层编辑器 - 一键启动"
echo "  检测到平台: $OS"
echo "======================================${NC}"

# ========== 1. JDK 21 检测 ==========
check_java() {
    echo "${YELLOW}[1/5] 检测 JDK 21...${NC}"

    # 候选 JDK 21 路径列表
    local jdk_paths=()

    if [ "$OS" = "mac" ]; then
        jdk_paths=(
            "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
            "/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
            "$HOME/Library/Java/JavaVirtualMachines/openjdk-21"*/Contents/Home
            "$HOME/.sdkman/candidates/java/21"*/
        )
    elif [ "$OS" = "windows" ]; then
        # Git Bash 下 Windows 路径
        # 先检查 Windows JAVA_HOME 环境变量
        if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java.exe" ]; then
            local ver=$("$JAVA_HOME/bin/java.exe" -version 2>&1 | head -1 | grep -oE 'version "[0-9]+' | head -1 | grep -oE '[0-9]+')
            if [ "$ver" = "21" ]; then
                echo "${GREEN}       JAVA_HOME 已指向 JDK 21 ($JAVA_HOME)${NC}"
                return 0
            fi
        fi
        jdk_paths=(
            "/d/Program Files (x86)/Java/jdk-21"
            "/d/Program Files/Java/jdk-21"
            "/c/Program Files/Java/jdk-21"
            "/c/Program Files/Eclipse Adoptium/jdk-21.0.6-hotspot"
            "/c/Program Files/Eclipse Adoptium/jdk-21.0.5-hotspot"
        )
    else
        jdk_paths=(
            "/usr/lib/jvm/java-21-openjdk"*
            "/usr/lib/jvm/jdk-21"*
            "$HOME/.sdkman/candidates/java/21"*/
        )
    fi

    # 先检查当前 java 是否已经是 21
    if command -v java &>/dev/null; then
        local ver=$(java -version 2>&1 | head -1 | grep -oE '"[0-9]+' | head -1 | tr -d '"')
        # Java 9+ 版本号就是主版本号，Java 8 是 1.8
        local major=${ver%%.*}
        if [ "$major" = "21" ]; then
            echo "${GREEN}       JDK 21 已就绪 ($(java -version 2>&1 | head -1))${NC}"
            return 0
        fi
    fi

    # 搜索候选路径
    for p in "${jdk_paths[@]}"; do
        # 使用通配符展开
        for expanded in $p; do
            if [ -d "$expanded" ] && [ -x "$expanded/bin/java" ]; then
                export JAVA_HOME="$expanded"
                export PATH="$JAVA_HOME/bin:$PATH"
                echo "${GREEN}       自动设置 JAVA_HOME=$JAVA_HOME${NC}"
                return 0
            fi
        done
    done

    # 最后尝试 sdkman
    if [ -f "$HOME/.sdkman/bin/sdkman-init.sh" ]; then
        source "$HOME/.sdkman/bin/sdkman-init.sh"
        if java -version 2>&1 | head -1 | grep -q "21"; then
            echo "${GREEN}       JDK 21 通过 SDKMAN 加载${NC}"
            return 0
        fi
    fi

    echo "${RED}       未找到 JDK 21！${NC}"
    if [ "$OS" = "mac" ]; then
        echo "${YELLOW}       安装: brew install openjdk@21${NC}"
    elif [ "$OS" = "windows" ]; then
        echo "${YELLOW}       下载: https://adoptium.net/ 安装 JDK 21${NC}"
    fi
    return 1
}

# ========== 2. PostgreSQL 检测和启动 ==========
find_pg_bin() {
    # 优先使用 PATH 中的 psql
    if command -v psql &>/dev/null; then
        dirname "$(command -v psql)"
        return 0
    fi

    local pg_candidates=()
    if [ "$OS" = "mac" ]; then
        pg_candidates=(
            "/opt/homebrew/opt/postgresql@16/bin"
            "/opt/homebrew/opt/postgresql@17/bin"
            "/opt/homebrew/opt/postgresql/bin"
            "/usr/local/opt/postgresql@16/bin"
            "/usr/local/opt/postgresql@17/bin"
            "/usr/local/opt/postgresql/bin"
            "/Applications/Postgres.app/Contents/Versions/latest/bin"
        )
    elif [ "$OS" = "windows" ]; then
        pg_candidates=(
            "/d/PostgreSQL/pgsql/bin"
            "/c/Program Files/PostgreSQL/16/bin"
            "/c/Program Files/PostgreSQL/17/bin"
            "/c/Program Files/PostgreSQL/*/bin"
        )
    else
        pg_candidates=(
            "/usr/lib/postgresql/16/bin"
            "/usr/lib/postgresql/17/bin"
            "/usr/lib/postgresql/*/bin"
        )
    fi

    for p in "${pg_candidates[@]}"; do
        for expanded in $p; do
            if [ -d "$expanded" ] && [ -x "$expanded/psql" -o -x "$expanded/psql.exe" ]; then
                echo "$expanded"
                return 0
            fi
        done
    done

    return 1
}

find_pg_data() {
    local pg_bin="$1"
    local data_candidates=()

    if [ "$OS" = "mac" ]; then
        data_candidates=(
            "/opt/homebrew/var/postgresql@16"
            "/opt/homebrew/var/postgresql@17"
            "/opt/homebrew/var/postgres"
            "/usr/local/var/postgresql@16"
            "/usr/local/var/postgres"
            "$HOME/Library/Application Support/Postgres/var-16"
        )
    elif [ "$OS" = "windows" ]; then
        data_candidates=(
            "/d/PostgreSQL/data"
            "/c/Program Files/PostgreSQL/16/data"
            "/c/Program Files/PostgreSQL/17/data"
        )
    else
        data_candidates=(
            "/var/lib/postgresql/16/main"
            "/var/lib/postgresql/17/main"
            "/var/lib/postgresql/data"
        )
    fi

    for p in "${data_candidates[@]}"; do
        for expanded in $p; do
            if [ -d "$expanded" ] && [ -f "$expanded/PG_VERSION" ]; then
                echo "$expanded"
                return 0
            fi
        done
    done

    return 1
}

check_postgres() {
    echo "${YELLOW}[2/5] 检测 PostgreSQL...${NC}"

    local pg_bin
    pg_bin=$(find_pg_bin) || {
        echo "${RED}       未找到 PostgreSQL！${NC}"
        if [ "$OS" = "mac" ]; then
            echo "${YELLOW}       安装: brew install postgresql@16${NC}"
        elif [ "$OS" = "windows" ]; then
            echo "${YELLOW}       下载: https://www.postgresql.org/download/windows/${NC}"
        fi
        return 1
    }

    # 加入 PATH
    export PATH="$pg_bin:$PATH"
    echo "       PostgreSQL bin: $pg_bin"

    # 检查端口 5432 是否在监听
    local port_ok=false
    if [ "$OS" = "mac" ]; then
        lsof -i :5432 &>/dev/null && port_ok=true
    else
        netstat -an 2>/dev/null | grep -q ":5432 .*LISTEN" && port_ok=true
    fi

    if $port_ok; then
        echo "${GREEN}       PostgreSQL 已运行 (端口 5432)${NC}"
        return 0
    fi

    # PostgreSQL 没启动，尝试自动启动
    echo "${YELLOW}       PostgreSQL 未运行，尝试自动启动...${NC}"

    # 方法1: brew services (Mac)
    if [ "$OS" = "mac" ] && command -v brew &>/dev/null; then
        local pg_service=$(brew services list 2>/dev/null | grep -E "^postgresql@" | head -1 | awk '{print $1}')
        if [ -n "$pg_service" ]; then
            brew services start "$pg_service" 2>/dev/null && {
                sleep 2
                echo "${GREEN}       PostgreSQL 已通过 brew services 启动${NC}"
                return 0
            }
        fi
    fi

    # 方法2: pg_ctl start
    local pg_data
    pg_data=$(find_pg_data "$pg_bin") && {
        local pg_ctl="$pg_bin/pg_ctl"
        [ -f "$pg_bin/pg_ctl.exe" ] && pg_ctl="$pg_bin/pg_ctl.exe"

        # 查找日志目录
        local log_dir="/tmp"
        [ "$OS" = "windows" ] && log_dir="$TEMP"

        "$pg_ctl" start -D "$pg_data" -l "$log_dir/postgresql.log" 2>/dev/null && {
            sleep 2
            echo "${GREEN}       PostgreSQL 已通过 pg_ctl 启动 (data: $pg_data)${NC}"
            return 0
        }
    }

    # 方法3: Windows 服务
    if [ "$OS" = "windows" ]; then
        powershell.exe -Command "Get-Service -Name 'postgresql*' | Where-Object {\$_.Status -ne 'Running'} | Start-Service" 2>/dev/null && {
            sleep 3
            echo "${GREEN}       PostgreSQL 服务已启动${NC}"
            return 0
        }
    fi

    echo "${RED}       无法自动启动 PostgreSQL，请手动启动${NC}"
    if [ "$OS" = "mac" ]; then
        echo "${YELLOW}       brew services start postgresql@16${NC}"
    elif [ "$OS" = "windows" ]; then
        echo "${YELLOW}       \"D:/PostgreSQL/pgsql/bin/pg_ctl.exe\" start -D \"D:/PostgreSQL/data\"${NC}"
    fi
    return 1
}

# ========== 3. 数据库检测和创建 ==========
setup_database() {
    echo "${YELLOW}[3/5] 检测数据库...${NC}"

    # 确定连接参数
    local pg_bin
    pg_bin=$(find_pg_bin)

    local psql_cmd="$pg_bin/psql"
    [ -f "$pg_bin/psql.exe" ] && psql_cmd="$pg_bin/psql.exe"
    local createdb_cmd="$pg_bin/createdb"
    [ -f "$pg_bin/createdb.exe" ] && createdb_cmd="$pg_bin/createdb.exe"

    # 设置连接参数
    local conn_args="-h localhost -p 5432"
    if [ "$OS" = "mac" ]; then
        conn_args="$conn_args -U $(whoami)"
    else
        conn_args="$conn_args -U postgres"
        export PGPASSWORD="${DB_PASSWORD:-postgres}"
    fi

    # 检查数据库是否存在
    if "$psql_cmd" $conn_args -lqt 2>/dev/null | cut -d\| -f1 | grep -qw layer_editor; then
        echo "${GREEN}       数据库 layer_editor 已存在${NC}"
    else
        echo "${YELLOW}       创建数据库 layer_editor...${NC}"
        if [ "$OS" = "mac" ]; then
            "$createdb_cmd" layer_editor 2>/dev/null || {
                "$createdb_cmd" -U postgres layer_editor 2>/dev/null || true
            }
        else
            "$createdb_cmd" $conn_args layer_editor 2>/dev/null || true
        fi
        # 验证
        if "$psql_cmd" $conn_args -lqt 2>/dev/null | cut -d\| -f1 | grep -qw layer_editor; then
            echo "${GREEN}       数据库 layer_editor 创建成功${NC}"
        else
            echo "${YELLOW}       数据库可能需要手动创建${NC}"
            if [ "$OS" = "mac" ]; then
                echo "       createdb layer_editor"
            else
                echo "       PGPASSWORD=postgres createdb -U postgres layer_editor"
            fi
        fi
    fi
}

# ========== 4. 前端依赖检测 ==========
check_frontend_deps() {
    echo "${YELLOW}[4/5] 检测前端依赖...${NC}"
    if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
        echo "${YELLOW}       安装前端依赖（首次运行）...${NC}"
        cd "$SCRIPT_DIR/frontend" && npm install
    fi
    echo "${GREEN}       前端依赖已就绪${NC}"
}

# ========== 5. 启动服务 ==========
start_backend() {
    echo "${YELLOW}[5/5] 启动服务...${NC}"

    # 确定 Spring profile
    local profile="${SPRING_PROFILE:-$OS}"

    # 检查 8080 端口
    if [ "$OS" = "mac" ]; then
        lsof -i :8080 &>/dev/null && {
            echo "${GREEN}       后端已在运行 (端口 8080)${NC}"
            return 0
        }
    else
        netstat -an 2>/dev/null | grep -q ":8080 .*LISTEN" && {
            echo "${GREEN}       后端已在运行 (端口 8080)${NC}"
            return 0
        }
    fi

    echo "       启动后端 (profile: $profile)..."
    cd "$SCRIPT_DIR/backend"

    local log_dir="/tmp"
    [ "$OS" = "windows" ] && log_dir="$TEMP"

    nohup mvn spring-boot:run -Dspring-boot.run.profiles="$profile" -DskipTests \
        > "$log_dir/layer-editor-backend.log" 2>&1 &
    BACKEND_PID=$!

    # 等待后端启动（最多 60 秒）
    echo "       等待后端启动..."
    for i in $(seq 1 60); do
        # 检测端口响应（401也表示服务已启动）
        local code=$(curl --noproxy localhost -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/documents 2>/dev/null)
        if [ -n "$code" ] && [ "$code" != "000" ]; then
            echo "${GREEN}       后端启动成功 (PID: $BACKEND_PID)${NC}"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "${RED}       后端启动超时，日志: $log_dir/layer-editor-backend.log${NC}"
            return 1
        fi
        sleep 1
        printf "\r       等待中... %ds" $i
    done
    echo ""
}

start_frontend() {
    # 检查 5173 端口
    if curl --noproxy localhost -sf http://localhost:5173 >/dev/null 2>&1; then
        echo "${GREEN}       前端已在运行 (端口 5173)${NC}"
        return 0
    fi

    echo "       启动前端..."
    cd "$SCRIPT_DIR/frontend"

    local log_dir="/tmp"
    [ "$OS" = "windows" ] && log_dir="$TEMP"

    nohup npm run dev > "$log_dir/layer-editor-frontend.log" 2>&1 &
    FRONTEND_PID=$!

    for i in $(seq 1 15); do
        if curl --noproxy localhost -sf http://localhost:5173 >/dev/null 2>&1; then
            echo "${GREEN}       前端启动成功 (PID: $FRONTEND_PID)${NC}"
            return 0
        fi
        sleep 1
    done
    echo "${RED}       前端启动超时，日志: $log_dir/layer-editor-frontend.log${NC}"
    return 1
}

# ========== 主流程 ==========
main() {
    check_java      || exit 1
    check_postgres  || exit 1
    setup_database
    check_frontend_deps
    start_backend   || exit 1
    start_frontend  || exit 1

    echo ""
    echo "${GREEN}======================================"
    echo "  启动完成！"
    echo "  前端: http://localhost:5173"
    echo "  后端: http://localhost:8080"
    echo "======================================${NC}"

    # 打开浏览器
    if [ "$OS" = "mac" ]; then
        open http://localhost:5173 2>/dev/null
    elif [ "$OS" = "windows" ]; then
        start http://localhost:5173 2>/dev/null
    elif command -v xdg-open &>/dev/null; then
        xdg-open http://localhost:5173 2>/dev/null
    fi
}

main
