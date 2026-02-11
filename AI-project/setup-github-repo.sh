#!/bin/bash

# 简化的 GitHub 仓库创建脚本

set -e

REPO_NAME="shipany-template_1226"
GITHUB_USER="tonyxuyk"

echo "═══════════════════════════════════════════════════"
echo "  创建 GitHub 仓库: ${REPO_NAME}"
echo "═══════════════════════════════════════════════════"
echo ""

# 检查 GitHub CLI 是否安装
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI 未安装"
    echo "正在安装..."
    brew install gh
fi

# 检查登录状态
if ! gh auth status &>/dev/null; then
    echo "⚠️  需要先登录 GitHub"
    echo "正在启动登录流程..."
    gh auth login
fi

echo ""
echo "✓ GitHub CLI 已就绪"
echo ""

# 检查远程仓库是否已存在
if git remote get-url origin &>/dev/null; then
    current_remote=$(git remote get-url origin)
    echo "当前远程地址: $current_remote"
    echo ""
    read -p "是否要创建新仓库并替换现有远程地址? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "操作已取消"
        exit 0
    fi
fi

# 创建仓库并推送
echo ""
echo "正在创建仓库: ${GITHUB_USER}/${REPO_NAME}..."
echo ""

# 创建仓库（如果不存在）
if gh repo view "${GITHUB_USER}/${REPO_NAME}" &>/dev/null; then
    echo "✓ 仓库已存在: https://github.com/${GITHUB_USER}/${REPO_NAME}"
else
    gh repo create "${REPO_NAME}" --public --description "ShipAny Template Project"
    echo "✓ 仓库创建成功: https://github.com/${GITHUB_USER}/${REPO_NAME}"
fi

# 设置远程地址
echo ""
echo "正在设置远程地址..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
echo "✓ 远程地址已设置"

# 推送代码
echo ""
echo "正在推送代码到 GitHub..."
echo ""
git push -u origin main

echo ""
echo "═══════════════════════════════════════════════════"
echo "✓ 完成！仓库已创建并推送成功"
echo "═══════════════════════════════════════════════════"
echo ""
echo "仓库地址: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""

