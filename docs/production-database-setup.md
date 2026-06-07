# 生产数据库与迁移

本文档说明 ai-medicine-vault 在生产环境使用 PostgreSQL 与 Prisma 迁移的流程。

## 1. 选择托管数据库

推荐任选其一：

- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- 云厂商 RDS（阿里云、AWS 等）

要求：

- 支持 PostgreSQL 14+
- 提供连接字符串（`DATABASE_URL`）
- 开启自动备份

## 2. 环境变量

| 环境 | 配置文件 | 说明 |
|------|----------|------|
| 本地开发 | `.env.local` | 本地 PostgreSQL |
| 生产 | 部署平台环境变量 | 托管数据库连接串 |

生产环境至少配置：

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
GITHUB_ID="..."
GITHUB_SECRET="..."
DASHSCOPE_API_KEY="..."
SENTRY_DSN="..."
NEXT_PUBLIC_SENTRY_DSN="..."
```

不要在生产环境复用本地 `.env.local`。

## 3. 迁移命令

### 本地开发

```bash
# 确保 .env.local 中 DATABASE_URL 可用
npm run prisma:migrate
```

若本地 PostgreSQL 未启动或权限不足，可先启动数据库再执行。迁移文件已在 `prisma/migrations/` 中版本化管理。

### 生产部署

部署前或 CI/CD 中执行：

```bash
npm run prisma:deploy
```

该命令等价于 `prisma migrate deploy`，只应用已提交的 migration，不会创建新 migration。

## 4. 发布检查清单

1. 备份当前生产数据库
2. 在 staging 或本地对生产连接串做一次 `prisma migrate deploy` 演练
3. 确认 `User`、`Account`、`Session` 等 Auth.js 表已创建
4. 部署应用并验证登录、数据隔离、AI 接口
5. 迁移失败时从备份恢复，不要手工改表

## 5. 常见问题

### `P1010: User was denied access`

本地 `DATABASE_URL` 账号没有建库/连库权限。检查 PostgreSQL 用户、密码和数据库名是否与 `.env.local` 一致。

### `datasource.url property is required`

Prisma CLI 未读到 `DATABASE_URL`。确认 `.env.local` 存在，或使用：

```bash
set -a && source .env.local && set +a && npm run prisma:migrate
```

### 生产首次部署

若生产库为空，`prisma migrate deploy` 会按顺序执行全部 migration，包括用户隔离与 Auth.js 模型。
