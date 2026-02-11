# 哲学小思考 → 配对哲学家 (Next.js + Supabase + Vercel)

一个最小可用的全栈示例：登录后输入一段“哲学小思考”，调用 AIHubMix (OpenAI 兼容接口) 生成匹配的 5 位哲学家，并把输入和结果写入 Supabase Postgres。支持历史列表与详情查看，未登录无法访问受保护页面。

## 本地快速启动
1. 进入项目根目录 `DD`。
2. 复制环境变量模板：`cp .env.local.example .env.local`，补全以下变量：
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目 URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=匿名公钥
   SUPABASE_SERVICE_ROLE_KEY=服务角色密钥 # 仅服务端使用，勿暴露到浏览器
   AIHUBMIX_BASE_URL=https://aihubmix.com/v1
   AIHUBMIX_API_KEY=你的 AIHubMix Key
   AIHUBMIX_MODEL=gpt-4o-mini
   ```
3. 安装依赖：`npm install`
4. 开发预览：`npm run dev`，浏览器打开 http://localhost:3000

## Supabase 配置
1. 在 Supabase SQL 编辑器执行 `supabase.sql`（根目录已提供同名文件）内容：
   - 创建 `public.thoughts` 表
   - 启用 RLS 并添加 4 条自定义策略（仅本人可 CRUD）
2. 确认 Auth 打开 Email+Password 登录方式。
3. 部署时在 Vercel 项目设置里添加环境变量，与本地 `.env.local` 一致。

### supabase.sql 摘要
```
create table if not exists public.thoughts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists thoughts_user_id_created_at_idx
on public.thoughts (user_id, created_at desc);
alter table public.thoughts enable row level security;
create policy "thoughts_select_own" on public.thoughts for select using (auth.uid() = user_id);
create policy "thoughts_insert_own" on public.thoughts for insert with check (auth.uid() = user_id);
create policy "thoughts_update_own" on public.thoughts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "thoughts_delete_own" on public.thoughts for delete using (auth.uid() = user_id);
```

## 关键技术点
- Next.js 14 App Router + TypeScript，无 pages router。
- Supabase Auth + RLS：未登录访问 /、/history、/thoughts/[id] 会被 middleware 重定向到 /login。
- AI 调用：`lib/llm/aihubmix.ts` 使用 AIHubMix 的 `/v1/chat/completions`，带 JSON Schema 约束；结果用 zod 校验后写库。
- 输入长度限制：20~4000 字，前后端双重校验。
- 防注入：系统提示固定要求“仅输出 JSON”，用户输入只作为内容，不影响格式。
- 前端状态：React hooks 管理，含加载与错误提示；成功生成后跳转详情页。
- 登出：导航栏调用 Supabase signOut 并跳转登录页。

## 部署到 Vercel
1. 将代码推送到仓库。
2. 在 Vercel 新建项目，框架选择 Next.js。
3. 配置环境变量（与 `.env.local` 相同）。
4. 构建命令 `npm run build`，输出目录自动处理。

## 目录速览
- `app/page.tsx`：输入/生成页
- `app/history/page.tsx`：历史列表（按创建时间倒序）
- `app/thoughts/[id]/page.tsx`：详情页
- `app/api/match/route.ts`：生成 + 落库接口
- `components/`：导航、表单、结果展示
- `lib/`：Supabase 客户端封装、LLM 调用、zod 校验
- `middleware.ts`：路由保护
- `supabase.sql`：表结构 + RLS

## 开发小贴士
- 如果 AI 返回的 JSON 校验失败，接口会返回 500 并提示，前端会展示友好错误。
- `SUPABASE_SERVICE_ROLE_KEY` 仅在服务端 API 使用，用于稳定写库；读取数据仍用用户 Session，遵守 RLS。
- 需要 Tailwind 等 UI 库可自行扩展，现有样式在 `app/globals.css`。
