# Auth.js 登录接入后续设计

日期：2026-04-28  
状态：第一阶段后续设计

## 1. 背景

当前项目已经完成第一阶段数据隔离骨架：

- 新增 `User` 数据模型
- 业务数据增加 `userId`
- repository 层通过 `RepositoryContext` 按用户过滤
- 页面和 API 已统一通过 `requireCurrentUser()` 获取当前用户上下文
- 开发环境暂时使用固定开发用户 `user-development`

这解决了“代码路径必须带用户上下文”的问题，但还没有真正的登录系统。生产上线前必须把固定开发用户替换为真实 session。

## 2. 目标

下一阶段目标是接入 Auth.js，让用户通过真实登录会话访问自己的健康资料。

完成后应满足：

- 用户可以登录和退出
- `requireCurrentUser()` 从真实 session 读取用户
- API 和页面继续沿用现有 `RepositoryContext`
- 未登录用户不能访问健康资料页面和业务 API
- 数据创建时绑定真实用户 ID

## 3. 推荐方案

推荐使用 Auth.js + Prisma Adapter。

原因：

- 与 Next.js App Router 适配成熟
- 可以复用当前 Prisma 数据层
- 后续支持邮箱、GitHub、Google 等 provider
- `User` 模型可以自然成为业务数据 owner

第一版登录 provider 建议先选邮箱或 GitHub。若只是个人使用，GitHub provider 接入成本更低；若面向普通用户，邮箱登录更自然。

## 4. 数据模型调整

当前 `User` 模型只包含业务所有权字段。接入 Auth.js 后需要补齐 Auth.js adapter 所需模型：

- `Account`
- `Session`
- `VerificationToken`
- 视 provider 情况可能需要扩展 `User.emailVerified`

原则：

- 保留现有 `User.id` 作为业务 owner ID
- 不改变业务表的 `userId` 含义
- 迁移时不要重建业务表

## 5. 代码改造点

### 5.1 Auth 配置

新增：

- `auth.ts`
- `app/api/auth/[...nextauth]/route.ts`

`auth.ts` 负责导出：

- `auth`
- `signIn`
- `signOut`
- `handlers`

### 5.2 当前用户上下文

修改：

- `features/medicine-vault/auth-context.ts`

目标：

- `getCurrentUser()` 调用 `auth()`
- session 存在时返回真实用户
- session 不存在时返回 `null`
- `requireCurrentUser()` 在未登录时抛出未授权错误

开发环境固定用户只能作为显式 fallback，不能在生产启用。

### 5.3 页面保护

建议新增：

- `middleware.ts`

保护路径：

- `/`
- `/members`
- `/members/:path*`
- `/records`
- `/medicines`
- `/allergies`
- `/assistant`
- `/visit-prep`
- `/api/members/:path*`
- `/api/records/:path*`
- `/api/medicines/:path*`
- `/api/allergies/:path*`
- `/api/assistant/:path*`

未登录页面请求跳转登录页。未登录 API 请求返回 401。

## 6. 迁移已有数据

本地和测试环境已有数据需要回填到默认用户。

建议流程：

1. 创建默认用户记录，例如 `user-development`
2. 将现有 `Member` 数据回填到该用户
3. 将 `MedicalRecord`、`Medicine`、`AllergyRecord`、`VisitPreparation` 的 `userId` 按成员关系同步
4. 确认没有空 `userId`
5. 再启用非空约束

生产环境如果没有历史数据，可以直接走新 schema。

## 7. 验收标准

- 未登录访问业务页面会被拦截
- 未登录调用业务 API 返回 401
- 登录后能看到自己的成员、病历、药品和过敏记录
- 用户 A 无法访问用户 B 的 `memberId`、`medicineId` 和药品图片
- AI 助手只读取当前登录用户的数据
- `npm run build` 通过
- 关键 API 和 repository 测试通过

## 8. 风险与注意事项

- 不要让开发固定用户在生产环境生效
- 不要让客户端传入的 `userId` 参与权限判断
- 不要在 API 错误里暴露 session、token 或数据库细节
- 不要让 AI 助手绕过 repository 直接查全量数据
- 图片接口必须继续使用 owner-scoped 查询

