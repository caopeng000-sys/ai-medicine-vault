# Vercel 生产部署

本文档说明如何将 ai-medicine-vault 部署到 Vercel，并配置生产环境变量。

## 1. 前置条件

- GitHub 仓库 `caopeng000-sys/ai-medicine-vault`，`main` 已包含 P0 改动
- 托管 PostgreSQL（Neon / Supabase 等），并已执行 `npm run prisma:deploy`
- （推荐）S3 兼容对象存储，用于药品图片
- GitHub OAuth App（生产回调 URL 见下文）
- DashScope API Key、Sentry DSN（可选）

## 2. 首次部署

### 方式 A：Vercel Dashboard（推荐）

1. 打开 [vercel.com/new](https://vercel.com/new)，导入 GitHub 仓库
2. Framework Preset：**Next.js**
3. Build Command：`npm run build`（默认）
4. Install Command：`npm ci`（默认）
5. 在 **Environment Variables** 中配置下方变量（Production）
6. Deploy

### 方式 B：Vercel CLI

```bash
npm install -g vercel
cd /path/to/ai-medicine-vault
vercel login
vercel link          # 关联团队/项目
vercel --prod        # 生产部署
```

## 3. 生产环境变量

在 Vercel Project → Settings → Environment Variables 中添加：

| 变量 | 必填 | 说明 |
|------|------|------|
| `DATABASE_URL` | ✅ | 托管 PostgreSQL 连接串 |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
| `GITHUB_ID` | ✅ | GitHub OAuth Client ID |
| `GITHUB_SECRET` | ✅ | GitHub OAuth Client Secret |
| `DASHSCOPE_API_KEY` | ✅ | 阿里百炼 API Key |
| `NEXT_PUBLIC_SENTRY_DSN` | 建议 | 前端 Sentry |
| `SENTRY_DSN` | 建议 | 服务端 Sentry |
| `S3_BUCKET` | 建议 | 药品图片 bucket |
| `S3_ACCESS_KEY_ID` | 建议 | 对象存储密钥 |
| `S3_SECRET_ACCESS_KEY` | 建议 | 对象存储密钥 |
| `S3_ENDPOINT` | 视提供商 | R2 / MinIO 等 |
| `S3_REGION` | 视提供商 | 默认 `auto` |

复制模板见仓库根目录 [`.env.example`](../.env.example)。

## 4. GitHub OAuth 回调

在 GitHub OAuth App 设置中配置：

- **Homepage URL**：`https://<your-domain>.vercel.app`
- **Authorization callback URL**：`https://<your-domain>.vercel.app/api/auth/callback/github`

Auth.js 使用 `trustHost: true`，无需额外 `AUTH_URL`（Vercel 会自动识别 host）。

## 5. 数据库迁移

**不要**在 Vercel build 中跑 `migrate dev`。在部署前或 CI 中单独执行：

```bash
DATABASE_URL="postgresql://..." npm run prisma:deploy
```

或在 Neon/Supabase 控制台 SQL 中确认 migration 已应用。

## 6. 部署后检查清单

- [ ] 访问 `/login`，GitHub 登录成功
- [ ] 未登录访问 `/` 跳转登录页
- [ ] 成员 / 药品 / 病历数据正常（owner 隔离）
- [ ] 上传药品图片（S3 或 DB 回退）
- [ ] 助手查询与图片识别可用
- [ ] Sentry 收到测试错误（可选：`/api/debug/sentry` 仅 development）

## 7. 与 CI 的关系

`.github/workflows/ci.yml` 在 PR 和 push 到 `main` 时运行 build + 测试。Vercel 可配置 **Deployment Protection**：Production 仅在 CI 通过后部署（Vercel Git Integration 设置）。

## 8. 相关文档

- [production-database-setup.md](./production-database-setup.md)
- [object-storage-setup.md](./object-storage-setup.md)
- [backup-and-recovery.md](./backup-and-recovery.md)
