#!/bin/bash

# 创建 GitHub 仓库并推送代码的脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REPO_NAME="shipany-template_1226"
GITHUB_USER="tonyxuyk"

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

# 检查 GitHub CLI
check_gh_cli() {
    if command -v gh >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 安装 GitHub CLI
install_gh_cli() {
    print_info "正在安装 GitHub CLI..."
    if command -v brew >/dev/null 2>&1; then
        brew install gh
        print_success "GitHub CLI 安装完成"
    else
        print_error "未检测到 Homebrew，请手动安装 GitHub CLI:"
        print_info "  brew install gh"
        print_info "  或访问: https://cli.github.com/"
        return 1
    fi
}

# 使用 GitHub CLI 创建仓库
create_repo_with_gh() {
    print_info "使用 GitHub CLI 创建仓库..."
    
    # 检查是否已登录
    if ! gh auth status &>/dev/null; then
        print_warning "GitHub CLI 未登录，正在登录..."
        gh auth login
    fi
    
    # 创建仓库
    print_info "正在创建仓库: ${GITHUB_USER}/${REPO_NAME}"
    gh repo create "${REPO_NAME}" --public --source=. --remote=new-origin --push
    
    if [ $? -eq 0 ]; then
        print_success "仓库创建成功！"
        print_info "仓库地址: https://github.com/${GITHUB_USER}/${REPO_NAME}"
        
        # 如果创建成功，可能需要更新远程地址
        if git remote get-url origin &>/dev/null; then
            print_info "当前远程地址: $(git remote get-url origin)"
            read -p "是否要将新仓库设置为默认远程地址? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                git remote set-url origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
                print_success "已更新远程地址"
            fi
        fi
        return 0
    else
        return 1
    fi
}

# 使用 GitHub API 创建仓库（需要 token）
create_repo_with_api() {
    print_info "使用 GitHub API 创建仓库..."
    
    if [ -z "$GITHUB_TOKEN" ]; then
        print_error "未设置 GITHUB_TOKEN 环境变量"
        print_info "请创建 Personal Access Token: https://github.com/settings/tokens"
        print_info "然后运行: export GITHUB_TOKEN=your_token_here"
        return 1
    fi
    
    print_info "正在创建仓库: ${GITHUB_USER}/${REPO_NAME}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: token ${GITHUB_TOKEN}" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"${REPO_NAME}\",\"description\":\"ShipAny Template Project\",\"private\":false}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        print_success "仓库创建成功！"
        
        # 更新远程地址
        git remote remove origin 2>/dev/null || true
        git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
        print_success "已设置远程地址"
        
        # 推送代码
        print_info "正在推送代码..."
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            print_success "代码推送成功！"
            print_info "仓库地址: https://github.com/${GITHUB_USER}/${REPO_NAME}"
        fi
        return 0
    else
        print_error "创建仓库失败"
        echo "$body" | grep -o '"message":"[^"]*"' | head -1
        return 1
    fi
}

# 手动创建仓库的说明
manual_instructions() {
    print_warning "请手动创建 GitHub 仓库"
    echo ""
    print_info "步骤："
    echo "  1. 访问: https://github.com/new"
    echo "  2. 仓库名称: ${REPO_NAME}"
    echo "  3. 选择 Public 或 Private"
    echo "  4. 不要初始化 README、.gitignore 或 license"
    echo "  5. 点击 'Create repository'"
    echo ""
    print_info "创建完成后，运行以下命令："
    echo ""
    echo "  # 移除现有远程地址（如果有）"
    echo "  git remote remove origin"
    echo ""
    echo "  # 添加新远程地址"
    echo "  git remote add origin https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
    echo ""
    echo "  # 推送代码"
    echo "  git push -u origin main"
    echo ""
}

# 主函数
main() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  创建 GitHub 仓库脚本${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}\n"
    
    print_info "仓库名称: ${REPO_NAME}"
    print_info "GitHub 用户: ${GITHUB_USER}"
    echo ""
    
    # 方法1: 尝试使用 GitHub CLI
    if check_gh_cli; then
        print_success "检测到 GitHub CLI"
        create_repo_with_gh
        exit 0
    fi
    
    # 方法2: 询问是否安装 GitHub CLI
    print_warning "未检测到 GitHub CLI"
    read -p "是否安装 GitHub CLI? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        if install_gh_cli; then
            create_repo_with_gh
            exit 0
        fi
    fi
    
    # 方法3: 尝试使用 GitHub API
    if [ ! -z "$GITHUB_TOKEN" ]; then
        print_info "检测到 GITHUB_TOKEN 环境变量"
        create_repo_with_api
        exit 0
    fi
    
    # 方法4: 提供手动创建说明
    manual_instructions
}

main

