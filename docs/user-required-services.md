# 需要用户配合开通和配置的事项

本文档只列出需要用户本人配合完成的事项，包括外部服务开通、账号授权、密钥创建、域名或平台配置。开发侧可以先继续完成本地代码、测试和文档，但以下事项最终上线前需要准备好。

## 总览

| 优先级 | 事项 | 是否必须 | 用途 |
| --- | --- | --- | --- |
| P0 | GitHub OAuth 应用 | 是 | 正式登录 |
| P0 | 生产 PostgreSQL 数据库 | 是 | 保存用户、成员、药品、病历数据 |
| P0 | 对象存储服务 | 是 | 保存药品图片 |
| P0 | 生产部署平台 | 是 | 正式访问应用 |
| P1 | 错误监控服务 | 建议 | 线上异常追踪 |
| P1 | Redis / KV 服务 | 建议 | 限流、缓存、任务状态 |
| P1 | 域名 | 建议 | 正式访问地址 |
| P2 | 短信 / 邮件 / 推送服务 | 后续 | 用药、过期、复诊提醒 |

## P0 必须准备

### 1. GitHub OAuth 应用

用途：

- 支持正式登录
- 让系统能够识别真实用户
- 为后续数据隔离、多人协作打基础

你需要做什么：

1. 登录 GitHub。
2. 进入 Developer settings。
3. 创建一个 OAuth App。
4. 填写应用名称和回调地址。
5. 获取 `Client ID` 和 `Client Secret`。

需要提供给项目的环境变量：

```bash
AUTH_GITHUB_ID="GitHub Client ID"
AUTH_GITHUB_SECRET="GitHub Client Secret"
AUTH_SECRET="生产环境随机密钥"
```

备注：

- `AUTH_SECRET` 可以由开发侧生成，但生产环境最终要放到部署平台环境变量里。
- OAuth 回调地址要根据最终部署域名填写。

### 2. 生产 PostgreSQL 数据库

用途：

- 保存用户数据
- 保存家庭成员数据
- 保存药品和病历数据
- 支持 Prisma migration

推荐免费或低成本选择：

- Supabase
- Neon
- Railway
- Render PostgreSQL

你需要做什么：

1. 选择一个 PostgreSQL 服务。
2. 创建一个数据库项目。
3. 获取连接字符串。
4. 把连接字符串配置到部署平台环境变量。

需要提供给项目的环境变量：

```bash
DATABASE_URL="postgresql://..."
```

验收方式：

- 生产环境可以执行 Prisma migration
- 应用可以正常读取和写入数据
- 重新部署后数据不丢失

### 3. 对象存储服务

用途：

- 保存药品图片
- 避免图片只存在本地导致部署后丢失
- 支持后续多设备访问

推荐选择：

- 阿里云 OSS
- Cloudflare R2
- AWS S3
- 腾讯云 COS

你需要做什么：

1. 开通对象存储服务。
2. 创建一个 bucket。
3. 创建访问密钥。
4. 确认图片访问策略：公开读或私有读签名 URL。

可能需要的环境变量：

```bash
STORAGE_PROVIDER="aliyun-oss"
STORAGE_BUCKET="bucket 名称"
STORAGE_REGION="地域"
STORAGE_ENDPOINT="访问 endpoint"
STORAGE_ACCESS_KEY_ID="访问 key"
STORAGE_ACCESS_KEY_SECRET="访问 secret"
STORAGE_PUBLIC_BASE_URL="图片公开访问地址，可选"
```

备注：

- 如果选择阿里云 OSS，后续可以和当前阿里百炼 API 生态保持一致。
- 如果希望尽量省钱，Cloudflare R2 也是一个常见选择。

### 4. 生产部署平台

用途：

- 提供正式访问地址
- 管理环境变量
- 自动构建和发布 Next.js 应用

推荐选择：

- Vercel
- Railway
- Render
- 自己的服务器

你需要做什么：

1. 选择部署平台。
2. 连接 GitHub 仓库。
3. 配置环境变量。
4. 部署项目。
5. 将部署地址回填到 GitHub OAuth 回调地址中。

最少需要配置的环境变量：

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="生产环境随机密钥"
AUTH_GITHUB_ID="GitHub Client ID"
AUTH_GITHUB_SECRET="GitHub Client Secret"
DASHSCOPE_API_KEY="阿里百炼 API Key"
```

对象存储接入后还需要配置对应存储环境变量。

## P1 建议准备

### 1. 错误监控服务

用途：

- 线上报错可追踪
- 前端和服务端异常可定位
- AI 调用、图片上传、数据库错误更容易排查

推荐选择：

- Sentry
- Logtail
- Axiom

你需要做什么：

1. 注册服务。
2. 创建项目。
3. 获取 DSN 或 API Key。
4. 配置到部署平台环境变量。

可能需要的环境变量：

```bash
SENTRY_DSN="..."
```

### 2. Redis / KV 服务

用途：

- API 限流
- AI 调用频控
- 缓存热点查询
- 后续任务状态管理

推荐选择：

- Upstash Redis
- Vercel KV
- Cloudflare KV

你需要做什么：

1. 创建 Redis 或 KV 实例。
2. 获取连接地址和 token。
3. 配置到部署平台环境变量。

可能需要的环境变量：

```bash
REDIS_URL="..."
REDIS_TOKEN="..."
```

### 3. 域名

用途：

- 给应用一个正式访问地址
- OAuth 回调更稳定
- 后续分享和家庭成员协作更自然

你需要做什么：

1. 购买或选择一个已有域名。
2. 在部署平台绑定域名。
3. 配置 DNS。
4. 更新 GitHub OAuth 回调地址。

建议：

- 早期可以先使用部署平台默认域名。
- 确定长期使用后再绑定自定义域名。

## P2 后续再准备

### 1. 短信、邮件或推送服务

用途：

- 用药提醒
- 药品过期提醒
- 复诊提醒
- 库存不足提醒

可选服务：

- Resend
- SendGrid
- 阿里云短信
- 微信服务通知
- 手机系统推送

当前建议：

- 暂时不用急着开通。
- 等提醒系统进入开发阶段再选择。

### 2. AI 知识库或向量检索服务

用途：

- 药品说明书检索
- 病历和药品联合问答
- 更复杂的家庭健康知识库

可选方案：

- PostgreSQL + pgvector
- 阿里云向量检索
- Supabase Vector
- Elasticsearch / OpenSearch

当前建议：

- 暂时不用急着开通。
- 先把当前结构化数据库查询和 AI 意图识别打稳。

## 当前你暂时不用配合的事项

以下任务开发侧可以先继续推进，不需要你先开通外部服务：

- API 安全加固
- 自动化测试补齐
- 药品管理体验优化
- AI 助手意图识别逻辑增强
- 文档整理
- 本地构建和测试
- CI 配置草稿

## 建议你优先处理的 3 件事

1. 选择生产数据库服务，并准备 `DATABASE_URL`。
2. 选择图片对象存储服务，并准备 bucket 和访问密钥。
3. 创建 GitHub OAuth App，并准备 `AUTH_GITHUB_ID` 和 `AUTH_GITHUB_SECRET`。

这三项准备好后，项目就可以进入真正的生产环境联调。

