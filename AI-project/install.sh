#!/bin/bash

# ShipAny Template 一键安装脚本
# 适用于 macOS 和 Linux

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  ShipAny Template 依赖安装脚本${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 Node.js 版本
check_node_version() {
    print_info "检查 Node.js 版本..."
    
    if ! command_exists node; then
        print_error "未检测到 Node.js，请先安装 Node.js 20 或更高版本"
        print_info "下载地址: https://nodejs.org/"
        print_info "或使用 nvm 安装: nvm install 20 && nvm use 20"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        print_error "Node.js 版本过低 (当前: $NODE_VERSION)，需要 >= 20.0.0"
        print_info "请升级 Node.js 版本:"
        print_info "  使用 nvm: nvm install 20 && nvm use 20"
        print_info "  或访问: https://nodejs.org/"
        exit 1
    fi
    
    print_success "Node.js 版本检查通过 (当前: $NODE_VERSION)"
}

# 安装 pnpm
install_pnpm() {
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm --version)
        print_success "pnpm 已安装 (版本: $PNPM_VERSION)"
        return
    fi
    
    print_warning "未检测到 pnpm，正在安装..."
    
    if command_exists npm; then
        npm install -g pnpm
        if command_exists pnpm; then
            print_success "pnpm 安装成功"
        else
            print_error "pnpm 安装失败，请手动安装: npm install -g pnpm"
            exit 1
        fi
    else
        print_error "未检测到 npm，无法安装 pnpm"
        print_info "请先安装 Node.js，或手动安装 pnpm:"
        print_info "  curl -fsSL https://get.pnpm.io/install.sh | sh -"
        exit 1
    fi
}

# 检查并安装依赖
install_dependencies() {
    print_info "开始安装项目依赖..."
    
    # 检查 lockfile 是否存在
    if [ -f "pnpm-lock.yaml" ]; then
        print_info "检测到 pnpm-lock.yaml，使用 pnpm 安装..."
        pnpm install
    elif [ -f "package-lock.json" ]; then
        print_warning "检测到 package-lock.json，但推荐使用 pnpm"
        read -p "是否使用 npm 安装? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm install
        else
            print_info "建议使用 pnpm，正在安装 pnpm..."
            install_pnpm
            pnpm install
        fi
    elif [ -f "yarn.lock" ]; then
        print_warning "检测到 yarn.lock，但推荐使用 pnpm"
        read -p "是否使用 yarn 安装? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! command_exists yarn; then
                print_error "未检测到 yarn，请先安装 yarn"
                exit 1
            fi
            yarn install
        else
            print_info "建议使用 pnpm，正在安装 pnpm..."
            install_pnpm
            pnpm install
        fi
    else
        # 没有 lockfile，使用 pnpm
        print_info "未检测到 lockfile，使用 pnpm 安装..."
        install_pnpm
        pnpm install
    fi
    
    print_success "依赖安装完成"
}

# 检查环境变量文件
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env 文件不存在"
        if [ -f ".env.example" ]; then
            print_info "从 .env.example 创建 .env 文件..."
            cp .env.example .env
            print_success ".env 文件已创建"
            print_warning "请编辑 .env 文件，配置以下必需变量:"
            print_info "  - DATABASE_URL: PostgreSQL 数据库连接字符串"
            print_info "  - AUTH_SECRET: 认证密钥"
            print_info "  生成 AUTH_SECRET: https://www.better-auth.com/docs/installation"
        else
            print_error ".env.example 文件不存在，请手动创建 .env 文件"
        fi
    else
        print_success ".env 文件已存在"
    fi
}

# 主函数
main() {
    print_header
    
    # 检查 Node.js
    check_node_version
    
    # 安装 pnpm
    install_pnpm
    
    # 安装项目依赖
    install_dependencies
    
    # 检查环境变量文件
    check_env_file
    
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    print_success "安装完成！"
    echo -e "${GREEN}═══════════════════════════════════════${NC}\n"
    
    print_info "下一步操作:"
    echo "  1. 编辑 .env 文件，配置 DATABASE_URL 和 AUTH_SECRET"
    echo "  2. 运行数据库迁移: pnpm db:generate && pnpm db:migrate"
    echo "  3. 启动开发服务器: pnpm dev"
    echo ""
}

# 运行主函数
main

