# AI Medicine Vault

AI Medicine Vault 是一个面向个人健康知识库的 Next.js 应用。项目目标是帮助用户集中管理病历资料、用药记录、家中常备药、过敏史和个人健康笔记，并在需要就医或咨询药师前，快速回顾自己的历史信息，整理出更清晰的问题清单。

本项目不以替代医生诊断为目标，而是定位为个人健康资料管理和信息整理工具。AI 能力后续会主要用于个人资料检索、上下文摘要和就医沟通准备。

## 项目背景

个人健康信息通常分散在多个地方：医院病历、检查报告截图、纸质处方、药盒说明、家庭提醒、聊天记录以及个人记忆。真正生病或需要复诊时，用户常常很难快速回答这些问题：

- 家里现在有哪些常备药？
- 某个症状以前是否出现过？
- 之前吃过哪些药，是否有不适或过敏反应？
- 哪些病历、检查报告和用药记录与当前情况有关？
- 看医生或问药师前，应该提前整理哪些问题？

AI Medicine Vault 希望提供一个以个人资料为中心的健康信息工作台，让用户能更系统地保存、检索和整理自己的健康上下文。

## 当前阶段

当前仓库处于早期前端脚手架阶段，已经完成：

- 基于 Next.js App Router 的项目结构。
- TypeScript 优先的工程配置。
- Tailwind CSS v4 设计 token 体系。
- shadcn/ui 组件系统初始化。
- 产品概念首页。
- 前端开发规范文档。
- 本地 Git 仓库和 GitHub 私有仓库初始化。

后续可以继续扩展病历管理、药品库存、文件上传、AI 检索、问诊摘要、权限和数据持久化等能力。

## 技术栈

- **前端框架：** Next.js 16
- **UI 运行时：** React 19
- **开发语言：** TypeScript
- **样式系统：** Tailwind CSS v4
- **组件体系：** shadcn/ui
- **底层交互组件：** Radix UI
- **图标库：** Lucide React
- **样式工具：** `clsx`、`tailwind-merge`、`class-variance-authority`
- **包管理器：** npm

## 目录结构

```text
app/
  globals.css            全局样式、Tailwind 引入和设计 token
  layout.tsx             根布局和页面元信息
  page.tsx               首页路由

components/
  medicine-vault/        业务域级组合组件
  ui/                    shadcn/ui 生成的基础组件

features/
  medicine-vault/        业务数据、辅助方法和领域逻辑

lib/
  utils.ts               通用工具方法

docs/
  frontend-playbook.md   前端架构和开发规范
```

## 本地开发

安装依赖：

```bash
npm install
```

启动本地 PostgreSQL：

```bash
npm run db:up
```

把 `.env.local.example` 复制为 `.env.local`，并确认其中的 `DATABASE_URL` 指向本地数据库：

```text
postgresql://postgres:postgres@127.0.0.1:5433/ai_medicine_vault?schema=public
```

执行 Prisma 迁移：

```bash
npx prisma migrate dev
```

启动开发服务：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

生产构建：

```bash
npm run build
```

启动生产服务：

```bash
npm run start
```

如果你已经切到生产数据库并准备部署前迁移：

```bash
npm run prisma:deploy
```

药品图片默认写到本地文件系统，数据库只保留 `imageKey`。如果你想手动调整存储目录，可以设置：

```bash
MEDICINE_IMAGE_STORAGE_DIR=".tmp/medicine-images"
```

旧版本已经写入数据库的 `imageBytes` 仍然兼容读取，不会影响现有记录。

如果你想把旧图片一次性迁到文件存储里，可以在连接好数据库后执行：

```bash
npm run medicine:backfill-images
```

如果你准备把图片切到 S3 兼容对象存储，把生产环境变量里的 `MEDICINE_IMAGE_STORAGE_PROVIDER` 改为 `s3`，并补充这些变量：

```bash
MEDICINE_IMAGE_STORAGE_BUCKET="..."
MEDICINE_IMAGE_STORAGE_REGION="..."
MEDICINE_IMAGE_STORAGE_ENDPOINT="..."
MEDICINE_IMAGE_STORAGE_ACCESS_KEY_ID="..."
MEDICINE_IMAGE_STORAGE_ACCESS_KEY_SECRET="..."
MEDICINE_IMAGE_STORAGE_FORCE_PATH_STYLE="true"
```

## 开发规范

- 默认使用 TypeScript。
- 路由文件保持轻量，复杂 UI 下沉到 `components/<domain>/`。
- 默认优先使用 Server Components，只有需要状态、事件、浏览器 API 或副作用时才添加 `"use client"`。
- 优先使用 shadcn/ui 基础组件，不重复造通用组件。
- 样式优先使用语义化 Tailwind token，例如 `bg-background`、`text-muted-foreground`、`border-border`、`text-primary`。
- 业务数据和领域逻辑放在 `features/<domain>/`。
- 重要变更交付前需要执行 `npm run build`。
- 项目文档、提交信息和面向仓库的说明统一使用中文。

更详细的前端约定见 [`docs/frontend-playbook.md`](docs/frontend-playbook.md)。

## 本地 PostgreSQL

本项目使用 PostgreSQL 作为正式数据库。为了不依赖付费云服务，仓库提供了本地 Docker 方案：

- `npm run db:up`：启动 PostgreSQL 17
- `npm run db:down`：停止数据库
- `npm run db:logs`：查看数据库日志
- `npm run db:reset`：重建本地数据库卷

本地数据库默认监听 `127.0.0.1:5433`，用户名和密码都是 `postgres`，数据库名是 `ai_medicine_vault`。

如果你想重置 schema，可以在数据库启动后执行：

```bash
npx prisma migrate dev
```

## 生产部署前配置

如果你准备把项目接到真实生产数据库，可以先从 `.env.production.example` 拷贝出生产环境变量文件，再把其中的连接串和密钥替换为真实值。

至少需要确认这些值：

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
DASHSCOPE_API_KEY="..."
MEDICINE_IMAGE_STORAGE_PROVIDER="local"
```

然后执行：

```bash
npm run prisma:deploy
```

## 产品方向

计划逐步建设的能力包括：

- 个人病历资料收集。
- 家庭药品库存管理。
- 过敏史和不良反应记录。
- 症状、复诊和用药时间线。
- 基于个人资料的 AI 检索。
- 就医或咨询药师前的问题清单生成。
- 隐私友好的用户数据管理方式。

## 医疗免责声明

本项目仅用于个人健康资料整理、信息检索和就医沟通准备，不提供医学诊断、治疗方案或专业医疗建议。任何 AI 生成的摘要和建议性内容，都应由医生、药师或其他合格医疗专业人员确认后再用于实际健康决策。

## 仓库状态

当前项目是早期私有仓库脚手架。API、数据模型、用户认证、数据持久化和 AI 工作流尚未最终确定。
