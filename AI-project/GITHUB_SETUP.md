# GitHub 仓库创建指南

## 快速创建仓库

由于需要 GitHub 登录验证，请按以下步骤操作：

### 方法一：使用脚本（推荐）

1. **先登录 GitHub CLI**（如果网络正常）：
   ```bash
   gh auth login
   ```
   
   如果网络有问题，可以尝试使用 token 方式：
   ```bash
   gh auth login --with-token < your_token.txt
   ```
   
   或者访问 https://github.com/settings/tokens 创建 Personal Access Token，然后：
   ```bash
   echo "your_token_here" | gh auth login --with-token
   ```

2. **运行创建脚本**：
   ```bash
   ./setup-github-repo.sh
   ```

### 方法二：手动创建（如果脚本无法运行）

1. **访问 GitHub 创建新仓库**：
   - 打开: https://github.com/new
   - 仓库名称: `shipany-template_1226`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"
   - 点击 "Create repository"

2. **设置远程地址并推送**：
   ```bash
   # 移除现有远程地址（如果需要）
   git remote remove origin
   
   # 添加新远程地址（替换为你的用户名）
   git remote add origin https://github.com/tonyxuyk/shipany-template_1226.git
   
   # 推送代码
   git push -u origin main
   ```

### 方法三：使用 GitHub API（需要 Token）

1. **创建 Personal Access Token**：
   - 访问: https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 勾选 `repo` 权限
   - 生成并复制 token

2. **使用 API 创建仓库**：
   ```bash
   export GITHUB_TOKEN="your_token_here"
   
   curl -X POST \
     -H "Authorization: token ${GITHUB_TOKEN}" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d '{"name":"shipany-template_1226","description":"ShipAny Template Project","private":false}'
   ```

3. **设置远程并推送**：
   ```bash
   git remote remove origin
   git remote add origin https://github.com/tonyxuyk/shipany-template_1226.git
   git push -u origin main
   ```

## 当前状态

- ✅ 文档和脚本已提交到本地仓库
- ⏳ 等待创建 GitHub 远程仓库
- ⏳ 等待推送代码到 GitHub

### 方法四：快速推送（推荐，如果仓库已创建）

如果你已经在 GitHub 上手动创建了仓库，可以直接运行：

```bash
./push-to-github.sh
```

## 已创建的文件

- `DEPENDENCIES.md` - 依赖梳理文档
- `install.sh` - macOS/Linux 安装脚本
- `install.ps1` - Windows 安装脚本
- `create-repo.sh` - 仓库创建辅助脚本
- `setup-github-repo.sh` - 简化的仓库创建脚本
- `push-to-github.sh` - 快速推送脚本（仓库已创建后使用）

