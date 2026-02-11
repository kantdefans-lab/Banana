#!/bin/bash

# 快速推送代码到 GitHub 的脚本
# 使用前提：已经在 GitHub 上手动创建了仓库 shipany-template_1226

set -e

REPO_NAME="shipany-template_1226"
GITHUB_USER="tonyxuyk"

echo "═══════════════════════════════════════════════════"
echo "  推送代码到 GitHub: ${REPO_NAME}"
echo "═══════════════════════════════════════════════════"
echo ""

# 检查仓库是否存在
echo "检查 GitHub 仓库是否存在..."
if gh repo view "${GITHUB_USER}/${REPO_NAME}" &>/dev/null 2>&1; then
    echo "✓ 仓库已存在"
else
    echo "❌ 仓库不存在，请先创建仓库："
    echo "   访问: https://github.com/new"
    echo "   仓库名: ${REPO_NAME}"
    echo "   创建后重新运行此脚本"
    exit 1
fi

# 设置远程地址
echo ""
echo "设置远程地址..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
echo "✓ 远程地址已设置: $(git remote get-url origin)"

# 推送代码
echo ""
echo "推送代码到 GitHub..."
echo ""
git push -u origin main

echo ""
echo "═══════════════════════════════════════════════════"
echo "✓ 完成！代码已推送到 GitHub"
echo "═══════════════════════════════════════════════════"
echo ""
echo "仓库地址: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""

