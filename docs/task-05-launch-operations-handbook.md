# 任务 05：上线操作手册

日期：2026-04-29

## 目标

给当前项目提供一份可执行的上线操作手册，覆盖环境变量、数据库迁移、启动校验、常见故障排查和发布前检查，减少后续接生产资源时的试错成本。

## 当前系统基础

- 前端与服务端：Next.js App Router
- 数据层：Prisma + PostgreSQL
- 登录骨架：Auth.js v5 + Prisma Adapter
- 图片识别：阿里百炼
- 数据隔离：基于 `userId`
- 保护层：`proxy.ts`

## 环境变量清单

本地或生产环境至少需要以下变量：

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="高强度随机字符串"
AUTH_GITHUB_ID="GitHub OAuth Client ID"
AUTH_GITHUB_SECRET="GitHub OAuth Client Secret"
DASHSCOPE_API_KEY="阿里百炼 API Key"
```

说明：

- `DATABASE_URL`：连接 PostgreSQL
- `AUTH_SECRET`：Auth.js session 加密使用
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`：GitHub 登录使用
- `DASHSCOPE_API_KEY`：药品图片识别和 AI 助手使用

## 发布前检查

发布前应至少执行以下命令：

```bash
npx prisma validate
npx prisma migrate deploy
npx tsx --test "features/**/*.test.ts" "app/api/**/*.test.ts"
npm run build
```

通过标准：

- Prisma schema 校验通过
- 生产迁移命令无报错
- 单元测试全绿
- Next.js 生产构建通过

## 数据库迁移顺序

当前仓库中的迁移顺序如下：

1. `20260425150044_init`
2. `20260426020152_medicine_image_storage`
3. `20260428153000_user_data_isolation`
4. `20260428170000_ai_call_log`
5. `20260428170000_authjs_adapter`

生产环境应统一使用：

```bash
npx prisma migrate deploy
```

不要直接手工改生产数据库结构。

## 登录与权限验证

上线前需要验证以下链路：

1. 未登录访问 `/medicines`、`/members`、`/assistant` 时会被拦到 `/login`
2. 未登录访问 `/api/members`、`/api/medicines`、`/api/export` 时返回 `401`
3. 登录后只能看到自己的成员、病历、药品和过敏记录
4. 药品图片接口不能访问其他用户数据

## AI 能力上线检查

需要验证：

1. `/api/assistant/query` 可正常响应
2. `/api/medicines/extract` 可正常识别图片
3. 输入超长问题时会返回受控错误
4. 图片超过大小限制时会被拒绝
5. `AiCallLog` 表能记录成功、失败和限流事件

## 常见故障排查

### 1. Auth.js 报 `MissingSecret`

原因：

- 缺少 `AUTH_SECRET`

处理：

```bash
openssl rand -base64 32
```

生成后写入 `.env` 或生产环境变量。

### 2. 登录页能打开，但没有 GitHub 登录按钮

原因：

- 没有配置 `AUTH_GITHUB_ID` 和 `AUTH_GITHUB_SECRET`

处理：

- 在 GitHub OAuth App 中创建应用
- 回调地址对齐当前环境
- 把 Client ID / Secret 写入环境变量

### 3. 页面能打开，但药品图片不显示

排查顺序：

1. 检查数据库 `Medicine.imageBytes` 是否存在数据
2. 检查 `/api/medicines/:id/image` 是否返回 `200`
3. 检查该药品是否属于当前登录用户
4. 检查本地是否已执行 `user_data_isolation` 迁移

### 4. AI 助手或图片识别突然失败

排查顺序：

1. 检查 `DASHSCOPE_API_KEY` 是否存在
2. 检查阿里百炼接口是否可用
3. 查看 `AiCallLog` 中最近失败记录
4. 确认不是命中了内存限流

### 5. 本地开发一切正常，生产环境 401

原因：

- 本地开发允许固定用户 fallback
- 生产环境严格要求真实 session

处理：

- 确认 OAuth provider 已配置
- 确认 `AUTH_SECRET` 存在
- 确认回调地址和域名一致

## 当前仍未接入的生产资源

这部分不属于本手册执行范围，但后续上线必须补：

- 托管 PostgreSQL
- 对象存储
- 自动备份
- 共享限流存储，例如 Redis / Upstash / KV
- 错误监控，例如 Sentry

## 本任务结果

本任务未改动业务逻辑，产出是一份仓库内可直接使用的上线操作手册，后续可以在接入生产数据库、对象存储和正式 OAuth 时继续补充。
