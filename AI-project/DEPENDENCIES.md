# 项目依赖说明

## 系统要求

### 必需的系统依赖

1. **Node.js** (>= 20.0.0)
   - 推荐使用 Node.js 20 LTS 版本
   - 下载地址: https://nodejs.org/
   - 验证安装: `node --version`

2. **pnpm** (推荐) 或 npm/yarn
   - 项目推荐使用 pnpm 作为包管理器
   - 安装方法: `npm install -g pnpm`
   - 验证安装: `pnpm --version`

3. **PostgreSQL** (数据库)
   - 需要 PostgreSQL 数据库用于数据存储
   - 可以是本地安装或远程数据库服务
   - 安装地址: https://www.postgresql.org/download/
   - 或使用云服务: Supabase, Railway, Vercel Postgres 等

## 项目依赖分类

### 核心框架依赖

- **Next.js 16.0.7** - React 框架
- **React 19.2.1** - UI 库
- **TypeScript** - 类型系统

### 数据库和 ORM

- **drizzle-orm** - ORM 工具
- **drizzle-kit** - 数据库迁移工具
- **@prisma/client** - Prisma 客户端
- **prisma** - Prisma 工具
- **postgres** - PostgreSQL 客户端
- **@libsql/client** - LibSQL 客户端

### 认证和授权

- **better-auth** - 认证系统
- **@better-fetch/fetch** - 网络请求库

### UI 组件库

- **@radix-ui/react-*** - Radix UI 组件系列（20+ 个组件）
- **tailwindcss** - CSS 框架
- **tailwindcss-animate** - Tailwind CSS 动画
- **lucide-react** - 图标库
- **framer-motion** - 动画库
- **swiper** - 轮播组件

### AI 相关

- **ai** - Vercel AI SDK
- **@ai-sdk/react** - React AI SDK
- **@ai-sdk/replicate** - Replicate AI SDK
- **@openrouter/ai-sdk-provider** - OpenRouter AI SDK
- **replicate** - Replicate API 客户端

### 表单和验证

- **react-hook-form** - 表单处理
- **@hookform/resolvers** - 表单验证解析器
- **zod** - 数据验证库

### 支付集成

- **stripe** - Stripe 支付
- **@paypal/checkout-server-sdk** - PayPal 支付
- **@paypal/paypal-server-sdk** - PayPal 服务端 SDK
- **creem** - Creem 支付

### 文档和内容

- **fumadocs-core** - 文档框架核心
- **fumadocs-mdx** - MDX 文档处理
- **fumadocs-ui** - 文档 UI 组件
- **next-mdx-remote** - MDX 远程处理
- **remark-gfm** - Markdown 扩展
- **rehype-autolink-headings** - Markdown 标题链接
- **rehype-slug** - Markdown slug 生成

### 国际化

- **next-intl** - Next.js 国际化

### 其他工具库

- **next-themes** - 主题切换
- **moment** - 日期处理
- **nanoid** - ID 生成
- **uuid** - UUID 生成
- **sonner** - 通知组件
- **recharts** - 图表库
- **resend** - 邮件服务

### 开发依赖

- **eslint** - 代码检查
- **prettier** - 代码格式化
- **typescript** - TypeScript 编译器
- **@types/node** - Node.js 类型定义
- **@types/react** - React 类型定义
- **tsx** - TypeScript 执行工具
- **wrangler** - Cloudflare Workers 工具

## 安装步骤

### 自动安装（推荐）

运行一键安装脚本：

```bash
# macOS/Linux
chmod +x install.sh
./install.sh

# Windows (PowerShell)
.\install.ps1
```

### 手动安装

1. 安装 Node.js 20+
   ```bash
   # 使用 nvm (推荐)
   nvm install 20
   nvm use 20
   ```

2. 安装 pnpm
   ```bash
   npm install -g pnpm
   ```

3. 安装项目依赖
   ```bash
   pnpm install
   ```

4. 配置环境变量
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置 DATABASE_URL 和 AUTH_SECRET
   ```

5. 初始化数据库
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

6. 启动开发服务器
   ```bash
   pnpm dev
   ```

## 环境变量配置

需要在 `.env` 文件中配置以下变量：

- `DATABASE_URL` - PostgreSQL 数据库连接字符串
- `AUTH_SECRET` - 认证密钥（可通过 [better-auth 文档](https://www.better-auth.com/docs/installation) 生成）

## 常见问题

1. **Node.js 版本不匹配**
   - 确保使用 Node.js 20 或更高版本
   - 使用 `nvm` 管理多个 Node.js 版本

2. **pnpm 未安装**
   - 运行 `npm install -g pnpm` 安装 pnpm
   - 或使用项目提供的安装脚本自动安装

3. **数据库连接失败**
   - 检查 PostgreSQL 服务是否运行
   - 验证 `DATABASE_URL` 环境变量是否正确

4. **依赖安装失败**
   - 清除缓存: `pnpm store prune`
   - 删除 node_modules 和 lockfile 重新安装
   - 检查网络连接和代理设置

