# ShipAny Template 一键安装脚本 (Windows PowerShell)

$ErrorActionPreference = "Stop"

# 颜色函数
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Header {
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  ShipAny Template 依赖安装脚本" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

# 检查命令是否存在
function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# 检查 Node.js 版本
function Test-NodeVersion {
    Write-Info "检查 Node.js 版本..."
    
    if (-not (Test-CommandExists "node")) {
        Write-Error "未检测到 Node.js，请先安装 Node.js 20 或更高版本"
        Write-Info "下载地址: https://nodejs.org/"
        exit 1
    }
    
    $nodeVersion = (node --version).TrimStart('v')
    $majorVersion = [int]($nodeVersion.Split('.')[0])
    
    if ($majorVersion -lt 20) {
        Write-Error "Node.js 版本过低 (当前: $nodeVersion)，需要 >= 20.0.0"
        Write-Info "请升级 Node.js 版本: https://nodejs.org/"
        exit 1
    }
    
    Write-Success "Node.js 版本检查通过 (当前: $nodeVersion)"
}

# 安装 pnpm
function Install-Pnpm {
    if (Test-CommandExists "pnpm") {
        $pnpmVersion = pnpm --version
        Write-Success "pnpm 已安装 (版本: $pnpmVersion)"
        return
    }
    
    Write-Warning "未检测到 pnpm，正在安装..."
    
    if (Test-CommandExists "npm") {
        npm install -g pnpm
        if (Test-CommandExists "pnpm") {
            Write-Success "pnpm 安装成功"
        } else {
            Write-Error "pnpm 安装失败，请手动安装: npm install -g pnpm"
            exit 1
        }
    } else {
        Write-Error "未检测到 npm，无法安装 pnpm"
        Write-Info "请先安装 Node.js，或手动安装 pnpm:"
        Write-Info "  iwr https://get.pnpm.io/install.ps1 -useb | iex"
        exit 1
    }
}

# 安装项目依赖
function Install-Dependencies {
    Write-Info "开始安装项目依赖..."
    
    if (Test-Path "pnpm-lock.yaml") {
        Write-Info "检测到 pnpm-lock.yaml，使用 pnpm 安装..."
        pnpm install
    } elseif (Test-Path "package-lock.json") {
        Write-Warning "检测到 package-lock.json，但推荐使用 pnpm"
        $response = Read-Host "是否使用 npm 安装? (y/N)"
        if ($response -match "^[Yy]$") {
            npm install
        } else {
            Write-Info "建议使用 pnpm，正在安装 pnpm..."
            Install-Pnpm
            pnpm install
        }
    } elseif (Test-Path "yarn.lock") {
        Write-Warning "检测到 yarn.lock，但推荐使用 pnpm"
        $response = Read-Host "是否使用 yarn 安装? (y/N)"
        if ($response -match "^[Yy]$") {
            if (-not (Test-CommandExists "yarn")) {
                Write-Error "未检测到 yarn，请先安装 yarn"
                exit 1
            }
            yarn install
        } else {
            Write-Info "建议使用 pnpm，正在安装 pnpm..."
            Install-Pnpm
            pnpm install
        }
    } else {
        Write-Info "未检测到 lockfile，使用 pnpm 安装..."
        Install-Pnpm
        pnpm install
    }
    
    Write-Success "依赖安装完成"
}

# 检查环境变量文件
function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Warning ".env 文件不存在"
        if (Test-Path ".env.example") {
            Write-Info "从 .env.example 创建 .env 文件..."
            Copy-Item ".env.example" ".env"
            Write-Success ".env 文件已创建"
            Write-Warning "请编辑 .env 文件，配置以下必需变量:"
            Write-Info "  - DATABASE_URL: PostgreSQL 数据库连接字符串"
            Write-Info "  - AUTH_SECRET: 认证密钥"
            Write-Info "  生成 AUTH_SECRET: https://www.better-auth.com/docs/installation"
        } else {
            Write-Error ".env.example 文件不存在，请手动创建 .env 文件"
        }
    } else {
        Write-Success ".env 文件已存在"
    }
}

# 主函数
function Main {
    Write-Header
    
    # 检查 Node.js
    Test-NodeVersion
    
    # 安装 pnpm
    Install-Pnpm
    
    # 安装项目依赖
    Install-Dependencies
    
    # 检查环境变量文件
    Test-EnvFile
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════" -ForegroundColor Green
    Write-Success "安装完成！"
    Write-Host "═══════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    
    Write-Info "下一步操作:"
    Write-Host "  1. 编辑 .env 文件，配置 DATABASE_URL 和 AUTH_SECRET"
    Write-Host "  2. 运行数据库迁移: pnpm db:generate; pnpm db:migrate"
    Write-Host "  3. 启动开发服务器: pnpm dev"
    Write-Host ""
}

# 运行主函数
Main

