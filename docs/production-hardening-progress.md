# 生产化补齐进度

日期：2026-04-28

## 已完成

- 接入 Auth.js v5 骨架，新增 `/api/auth/[...nextauth]`。
- 补齐 Prisma Adapter 所需的 `Account`、`Session`、`VerificationToken` 模型。
- `requireCurrentUser()` 已优先读取真实登录 session；生产环境无 session 会 fail closed。
- 新增生产环境 `proxy.ts` 访问保护，未登录页面跳转 `/login`，未登录 API 返回 401。
- 新增 `/login` 登录入口，当前使用 GitHub provider。
- 新增 `/api/export`，支持导出当前用户的成员、病历、药品和过敏记录 JSON。
- 新增 AI 调用内存限流与 `AiCallLog` 审计表。
- 药品图片识别和 AI 助手查询已增加限流、输入大小限制、失败兜底和调用日志。
- 新增 `/privacy` 隐私政策页面和 `/disclaimer` 医疗免责声明页面。
- 新增 GitHub Actions CI，覆盖 Prisma 校验、单元测试和生产构建。

## 需要配置的环境变量

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="生成一个高强度随机字符串"
AUTH_GITHUB_ID="GitHub OAuth Client ID"
AUTH_GITHUB_SECRET="GitHub OAuth Client Secret"
DASHSCOPE_API_KEY="阿里百炼 API Key"
```

## 仍需外部资源后才能完成

- 生产 PostgreSQL：需要选择 Supabase、Neon、Railway、Render 或云厂商 RDS，并配置生产 `DATABASE_URL`。
- 图片对象存储：需要选择阿里 OSS、Cloudflare R2、S3 或 Supabase Storage。当前图片仍保存在 PostgreSQL `bytea` 字段。
- 备份恢复：需要托管数据库和对象存储后配置自动备份、恢复演练和密钥轮换。
- 生产级限流：当前为单实例内存限流，多实例上线前应替换为 Redis、Upstash、Vercel KV 或 Cloudflare KV。

## 验收命令

```bash
npx prisma validate
npx prisma migrate deploy
npx tsx --test "features/**/*.test.ts" "app/api/**/*.test.ts"
npm run build
```
