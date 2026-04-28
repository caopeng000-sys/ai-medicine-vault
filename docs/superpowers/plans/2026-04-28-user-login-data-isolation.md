# 用户登录与数据隔离 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为生产化上线补齐第一层安全边界：用户所有权、数据隔离、API 访问上下文和后续 Auth.js 登录接入基础。

**Architecture:** 第一阶段先建立 `User` 数据模型和 `RepositoryContext`，让所有核心数据读取和写入都能按 `userId` 过滤。页面和 API 先通过统一的 server-side user helper 获取当前用户上下文，后续再把 helper 的来源切换到 Auth.js/登录 session。这样可以先消除“知道 id 就能读写”的越权风险，再接完整登录 UI。

**Tech Stack:** Next.js App Router, Prisma, PostgreSQL, TypeScript, Node test runner, current repository layer.

---

## Task 1: 用户所有权数据模型

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `features/medicine-vault/data.ts`

**Scope:**
- 新增 `User` 模型
- 为 `Member`、`MedicalRecord`、`Medicine`、`AllergyRecord`、`VisitPreparation` 增加 `userId`
- mock 数据增加固定开发用户归属
- 不接登录 UI
- 不安装 Auth.js

**Verification:**
- `npx prisma validate`
- `npm run build`

## Task 2: 当前用户上下文 helper

**Files:**
- Create: `features/medicine-vault/auth-context.ts`
- Create: `features/medicine-vault/auth-context.test.ts`

**Scope:**
- 定义 `RepositoryContext = { userId: string }`
- 定义固定开发用户 `DEFAULT_DEVELOPMENT_USER`
- 提供 `getCurrentUser()` 和 `requireCurrentUser()`
- 第一阶段在没有真实登录系统时返回固定开发用户
- 生产模式如果没有真实登录实现，应抛出明确错误，避免误上线

**Verification:**
- `npm exec --yes tsx --test features/medicine-vault/auth-context.test.ts`
- `npm run build`

## Task 3: Repository 按用户隔离

**Files:**
- Modify: `features/medicine-vault/repository.ts`
- Modify: `features/medicine-vault/repository.test.ts`

**Scope:**
- 所有列表函数接收 `ctx: RepositoryContext`
- 所有详情函数按 `userId` 过滤
- 所有创建函数写入 `userId`
- 创建子记录前确认 `memberId` 属于当前用户
- 更新/删除成员和药品时限定 `userId`
- 图片读取 `getMedicineImageById` 限定 `userId`
- mock fallback 也按 `userId` 过滤

**Priority Functions:**
- `listMembers`
- `getMemberById`
- `listMedicalRecords`
- `listMedicines`
- `listMedicinesPaginated`
- `getMedicineById`
- `getMedicineImageById`
- `listAllergyRecords`
- `listVisitPreparations`
- `createMember`
- `updateMember`
- `deleteMember`
- `createMedicalRecord`
- `createMedicine`
- `updateMedicine`
- `deleteMedicine`
- `createAllergyRecord`

**Verification:**
- `npm exec --yes tsx --test features/medicine-vault/repository.test.ts`
- `npm run build`

## Task 4: API 接入当前用户上下文

**Files:**
- Modify: `app/api/members/route.ts`
- Modify: `app/api/members/[memberId]/route.ts`
- Modify: `app/api/records/route.ts`
- Modify: `app/api/medicines/route.ts`
- Modify: `app/api/medicines/[medicineId]/route.ts`
- Modify: `app/api/medicines/[medicineId]/image/route.ts`
- Modify: `app/api/allergies/route.ts`
- Modify: `app/api/assistant/query/route.ts`
- Modify: `features/medicine-vault/assistant-service.ts`
- Modify: `app/api/assistant/query/route.test.ts`

**Scope:**
- 所有业务 API 入口调用 `requireCurrentUser()`
- repository 调用传入 `ctx`
- AI 助手只读取当前用户的数据
- 图片接口只返回当前用户拥有的药品图片
- 暂不做登录页面，未登录保护由 helper 后续接 Auth.js

**Verification:**
- `npm exec --yes tsx --test app/api/assistant/query/route.test.ts`
- `npm exec --yes tsx --test features/medicine-vault/assistant-service.test.ts`
- `npm run build`

## Task 5: 页面读取接入当前用户上下文

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/members/page.tsx`
- Modify: `app/members/[memberId]/page.tsx`
- Modify: `app/records/page.tsx`
- Modify: `app/medicines/page.tsx`
- Modify: `app/allergies/page.tsx`
- Modify: `app/visit-prep/page.tsx`

**Scope:**
- 所有 server page 调用 `requireCurrentUser()`
- 所有 repository 读取传入 `ctx`
- 暂不做登录跳转 UI
- 保持当前页面视觉和交互不变

**Verification:**
- `npm run build`
- 本地访问 `/members`、`/medicines`、`/assistant` 确认页面可渲染

## Task 6: 迁移说明与下一步 Auth.js 接入设计

**Files:**
- Create: `docs/superpowers/specs/2026-04-28-authjs-login-followup-design.md`
- Modify: `docs/production-readiness-roadmap.md`

**Scope:**
- 说明第一阶段只是所有权隔离骨架
- 下一阶段再接 Auth.js/Prisma Adapter 登录
- 写清楚生产上线前必须把固定开发用户替换为真实 session
- 写清楚迁移已有数据到默认用户的策略

**Verification:**
- 文档无 `TODO/TBD/待补`
- `npm run build`

