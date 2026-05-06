# 任务 11：生产 PostgreSQL 接入准备

## 本次完成内容

- 补充了生产部署前的 Prisma 命令：`npm run prisma:deploy`
- 增加了 `.env.production.example`
- 更新了 `README.md` 中的生产部署前检查步骤

## 生产数据库接入建议

你可以从以下免费或低成本 PostgreSQL 服务中选一个：

- Supabase
- Neon
- Railway
- Render PostgreSQL

接入时的核心动作只有三步：

1. 创建数据库实例。
2. 拿到 `DATABASE_URL`。
3. 在部署平台和本地生产环境里填入该连接串。

## 生产环境变量

至少需要准备：

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="replace-with-a-long-random-string"
AUTH_GITHUB_ID="github-oauth-client-id"
AUTH_GITHUB_SECRET="github-oauth-client-secret"
DASHSCOPE_API_KEY="dashscope-api-key"
```

## 迁移命令

部署前在生产环境执行：

```bash
npm run prisma:deploy
```

如果你只是想先检查 schema 是否可用：

```bash
npm run prisma:validate
```

## 相关文件

- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/package.json`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/.env.production.example`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/README.md`

## 后续可继续的方向

- 你选定数据库服务后，我可以继续帮你把生产部署说明写成一份一步一步的中文操作手册。
- 也可以继续往对象存储和备份恢复补齐。
