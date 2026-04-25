# 药品图片识别与回填 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在新增药品记录弹窗中支持本地上传图片，用阿里百炼识别药品图片并自动回填表单，再由用户确认后保存。

**Architecture:** 新增一个服务端图片识别接口，前端使用专用药品录入弹窗组件承载上传、识别、回填和提交。阿里百炼 API Key 保留在服务端环境变量里，AI 结果只作为辅助输入，不自动落库。

**Tech Stack:** Next.js App Router、TypeScript、React、Zod、PostgreSQL、Prisma、阿里百炼 OpenAI 兼容接口

---

### Task 1: 接入百炼配置与服务端提取器

**Files:**
- Create: `lib/ai/dashscope.ts`
- Create: `features/medicine-vault/medicine-image-extractor.ts`
- Modify: `.env.example`
- Modify: `.env`

- [ ] 定义百炼环境变量和响应类型
- [ ] 封装服务端调用函数
- [ ] 编写图片提取 prompt 和 JSON 解析逻辑

### Task 2: 新增图片识别 API

**Files:**
- Create: `app/api/medicines/extract/route.ts`

- [ ] 接收 `multipart/form-data`
- [ ] 校验图片类型和大小
- [ ] 调用药品图片提取器
- [ ] 返回统一中文错误和结构化结果

### Task 3: 扩展药品表单与校验

**Files:**
- Modify: `features/medicine-vault/schemas.ts`
- Modify: `features/medicine-vault/repository.ts`
- Modify: `app/api/medicines/route.ts`

- [ ] 在药品 schema 中加入 `purpose`
- [ ] 更新 `createMedicine` 写入逻辑
- [ ] 保持旧页面展示字段兼容

### Task 4: 新增药品专用录入弹窗

**Files:**
- Create: `components/medicine-vault/medicine-entry-dialog.tsx`
- Modify: `app/medicines/page.tsx`

- [ ] 实现图片上传
- [ ] 实现“AI 识别图片”按钮、加载状态和错误提示
- [ ] 将 AI 返回内容回填到表单
- [ ] 用户确认后再提交药品记录

### Task 5: 验证与收尾

**Files:**
- Modify: `.env`（仅本地）

- [ ] 配置 `DASHSCOPE_API_KEY`
- [ ] 运行 `npm run build`
- [ ] 通过接口验证识别和保存链路
- [ ] 检查页面交互是否正常
