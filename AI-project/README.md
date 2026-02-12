# ShipAny Template Two

## Preview

[https://cf-two.shipany.site/](https://cf-two.shipany.site/)

## 由于多次发生仓库被提交脏代码，给其他同学带来不便，现将仓库写权限关闭，仓库成员仅可读！

## Doc

[✨ShipanyTwo官方文档（作者已更新完）](https://www.shipany.ai/zh/docs)

[✨ShipanyTwo按照官方文档一步步走过程记录](https://github.com/boomer1678/shipany-template/issues/2)

[✨ShipanyTwo更新日志](https://github.com/boomer1678/shipany-template/issues/3)

[✨ShipAnyTwo架构要点总结](https://github.com/boomer1678/shipany-template/issues/1)

[✨ShipAnyTwo常见问题](https://github.com/boomer1678/shipany-template/issues/7)

## Video

[✨ShipanyTwo实战课程：AI壁纸生成器开发视频教学(2025-12-03)](https://github.com/boomer1678/shipany-template/issues/6)

[✨ShipanyTwo实战课程：从零搭建了一个一站式 AI 生成平台(2025-11-26)](https://github.com/boomer1678/shipany-template/issues/9)

## Branch

- `main`: two main branch
- `cloudfare`: two cloudfare branch
- `one/main`: one main branch (2025-08-06(v2.6.0))
- `one/cloudfare`: one cloudfare branch 


## Getting Started

1. Clone code and install

```shell
git clone git@github.com:boomer1678/shipany-template.git -b dev my-shipany-project
cd my-shipany-project
pnpm install
```

2. Set local development env

create `.env` file under root dir

```shell
cp .env.example .env
```

update env with DATABASE_URL and AUTH_SECRET

`DATABASE_URL` may like:

```shell
postgresql://user:password@host:port/db
```

`AUTH_SECRET` can be generated:

- [Generate Auth Secret](https://www.better-auth.com/docs/installation)

3. Create database tables with orm migrate

```shell
pnpm db:generate
pnpm db:migrate
```

4. Start dev server

```shell
pnpm dev
```

5. Deploy to vercel

push code to github and deploy to Vercel.

## Deploy to Cloudflare Workers (OpenNext)

This project includes OpenNext scripts for Cloudflare Workers:

```sh
pnpm cf:deploy
```

### Cloudflare "one-click" (Git) build settings

If your repo root contains `AI-project/` (this app is in a subfolder), set:

- Build command:

```sh
pnpm -C AI-project install --frozen-lockfile && pnpm -C AI-project exec opennextjs-cloudflare build
```

- Deploy command:

```sh
pnpm -C AI-project exec opennextjs-cloudflare deploy
```

### Required environment variables / secrets

At minimum you must set an auth secret. This code accepts either `AUTH_SECRET`
or `BETTER_AUTH_SECRET` (both work).

- `DATABASE_URL`
- `AUTH_SECRET` (or `BETTER_AUTH_SECRET`)
- `AUTH_URL` (set to your production domain, e.g. `https://yourdomain.com`)
- `AUTH_GOOGLE_ONLY=true` (optional, disable email/password and keep Google sign-in only)
- `ALLOW_DIRECT_DB_IN_WORKERS=true` (required when not using Hyperdrive)
- `DB_SINGLETON_ENABLED=false` (recommended on Workers to avoid hung auth requests)
- `DB_MAX_CONNECTIONS=1` (recommended baseline for Worker direct DB mode)
- `AUTH_HANDLER_TIMEOUT_MS=12000` (recommended to fail fast and surface backend timeout errors)

For Cloudflare Git one-click deploy, ensure the variables are set in both:
- `Production` environment
- `Preview` environment

If `AUTH_SECRET` is configured as a secret, do not duplicate it as plaintext var.

### Cloudflare Git deploy auth verification checklist

After each deployment, verify in this order:
1. If `AUTH_GOOGLE_ONLY=true`, open `/sign-in` and check only Google sign-in is shown.
2. Complete Google sign-in once and confirm callback returns to app.
3. Confirm no UI fallback like `Unknown error`; backend errors should include actionable text.
4. In Cloudflare logs, ensure `/api/auth/sign-in/social` and `/api/auth/get-session` are 200 or expected 4xx.
5. If a 5xx occurs, search logs by `x-auth-error-id` (or `errorId`) and check related auth env hints.

### Auth rollback path (Direct DATABASE_URL mode)

If login/register is still unstable in direct mode:
1. Configure Hyperdrive binding (`HYPERDRIVE`) for the Worker.
2. Remove or set `ALLOW_DIRECT_DB_IN_WORKERS=false`.
3. Redeploy and re-run the verification checklist.

### Deploy safety notes

- `wrangler deploy` can overwrite dashboard vars. Use `--keep-vars` when needed.
- If `/api/auth/*` times out, keep `AUTH_HANDLER_TIMEOUT_MS` configured so timeout errors are explicit.
