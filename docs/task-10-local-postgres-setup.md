# 任务 10：本地 PostgreSQL 标准化

## 本次完成内容

- 新增本地 PostgreSQL 启动配置，默认通过 Docker Compose 提供。
- 提供了 `.env.local.example`，方便直接复制成本地开发环境配置。
- 在 `package.json` 中增加了数据库管理脚本：
  - `npm run db:up`
  - `npm run db:down`
  - `npm run db:logs`
  - `npm run db:reset`
- `README.md` 已补充本地数据库启动和 Prisma 迁移说明。

## 本地数据库配置

- 容器镜像：`postgres:17-alpine`
- 宿主机端口：`5433`
- 数据库名：`ai_medicine_vault`
- 用户名：`postgres`
- 密码：`postgres`
- 连接串模板：

```text
postgresql://postgres:postgres@127.0.0.1:5433/ai_medicine_vault?schema=public
```

## 使用方式

1. 启动数据库：`npm run db:up`
2. 配置 `.env.local` 中的 `DATABASE_URL`
3. 执行迁移：`npx prisma migrate dev`
4. 启动应用：`npm run dev`

## 相关文件

- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/docker-compose.postgres.yml`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/.env.local.example`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/package.json`
- `/Users/cp/Downloads/个人项目/前端/ai-medicine-vault/README.md`

## 后续可继续的方向

- 如果你后面要上线，再把同样的 PostgreSQL 模式迁到云服务。
- 可以继续补一键初始化脚本，把迁移和种子数据再收拢一点。
