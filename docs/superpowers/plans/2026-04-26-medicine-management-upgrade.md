# 药品管理升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有药品管理升级成更实用的家庭药箱首页，补强库存、位置、状态、搜索和提醒，同时保留单条主记录模式，方便后续平滑升级到批次管理。

**Architecture:** 继续沿用当前的 Next.js App Router + Prisma + PostgreSQL 架构，不引入新的服务拆分。药品数据仍以单条主记录展示，但补上库存、存放位置和自动状态计算；搜索和筛选走数据库真实查询；图片预览保持内联显示，不再跳转页面。后续如果要做批次能力，只需要在当前主记录之下增加扩展层，不推翻这一版。

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma 7, PostgreSQL, shadcn/ui, Tailwind CSS, 阿里百炼视觉模型（已存在）

---

### Task 1: 数据模型与仓储层补强

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `features/medicine-vault/data.ts`
- Modify: `features/medicine-vault/repository.ts`
- Modify: `features/medicine-vault/schemas.ts`

- [ ] **Step 1: 写出回归验证脚本，确认当前药品字段和状态计算入口存在**

```bash
rg -n "quantity|storageLocation|usageNote|safetyNote|hasImage|imageName|listMedicines|CreateMedicineInput" prisma/schema.prisma features/medicine-vault
```

Expected: 能找到现有字段和仓储函数，说明扩展点明确。

- [ ] **Step 2: 跑一次构建前检查，确认目前仓储层能正常导入**

```bash
npm run build
```

Expected: 当前版本应通过，作为后续改动的基线。

- [ ] **Step 3: 为药品记录补充更清晰的库存与位置语义**

把 `Medicine` 类型和仓储映射统一成可用于家庭药箱的结构：

```ts
export type Medicine = {
  id: string
  memberId: string
  name: string
  category: string
  dosage: string
  instructions: string
  purpose: string
  specification: string
  quantity: string
  expiresAt: string
  storageLocation: string
  usageNote: string
  safetyNote: string
  hasImage?: boolean
  imageName?: string
}
```

如果数据库里缺失这些值，继续使用现有默认值兜底，不要求历史数据补录。

- [ ] **Step 4: 把药品查询升级为可组合筛选**

在 `listMedicines(memberId?, query?)` 的基础上，后续再预留 `status`、`storageLocation` 和 `hasImage` 的筛选入口。第一版只要求搜索真实数据库字段，筛选接口先留出函数参数与查询组织方式。

预期查询逻辑：

```ts
where: {
  ...(memberId ? { memberId } : {}),
  ...(query ? { OR: [...] } : {}),
}
```

- [ ] **Step 5: 跑数据库相关的最小验证**

```bash
psql 'postgresql://cp@localhost:5432/ai_medicine_vault' -c "select count(*) from \"Medicine\";"
```

Expected: 返回当前药品总数，证明本地库仍可读。

---

### Task 2: 药品页统计、搜索和排序增强

**Files:**
- Modify: `app/medicines/page.tsx`
- Modify: `components/medicine-vault/app-shell.tsx`（仅当顶部全局搜索要复用药品搜索参数时）

- [ ] **Step 1: 先定义药品页搜索参数的读取方式**

页面入口继续读取 `searchParams`，并支持：

```ts
searchParams: Promise<{ member?: string; q?: string }>
```

页面内的主搜索框使用 `GET` 表单提交，把关键词写到 `q` 参数。

- [ ] **Step 2: 验证当前药品页可以正常渲染**

```bash
npm run build
```

Expected: 先保证当前 UI 在没有搜索交互时不回归。

- [ ] **Step 3: 把搜索结果限制在真实数据库匹配范围内**

页面调用改成：

```ts
listMedicines(member, q)
```

并在页面标题区显示：

```ts
找到 X 条药品记录
```

当 `q` 存在时，副文案里提示当前正在搜索的关键词。

- [ ] **Step 4: 增加“无结果”空状态**

当搜索后没有结果时，展示一张横跨整行的提示卡：

```tsx
没有找到匹配的药品记录，请换一个关键词试试。
```

- [ ] **Step 5: 把药品卡排序改成处理优先级**

当前默认按有效期排序，后续在页面层增加一个稳定的优先级：

1. 已过期
2. 库存不足
3. 即将过期
4. 其他正常药品

如果本轮来不及把库存状态接入页面，先保留排序函数位置，不要硬塞未完成的 UI。

---

### Task 3: 药品卡片信息层级增强

**Files:**
- Modify: `app/medicines/page.tsx`
- Modify: `features/medicine-vault/data.ts`

- [ ] **Step 1: 给药品卡补一个更完整的展示骨架**

卡片顶部继续保留：

- 药品名称
- 所属成员
- 分类
- 有图标记
- 状态标签

同时补出下面这几个信息位：

- 库存数量
- 存放位置
- 过期状态
- AI 图片摘要入口

- [ ] **Step 2: 把原图展示固定为内联预览**

继续沿用当前的图片接口：

```tsx
<img src={`/api/medicines/${medicine.id}/image`} />
```

但图片区域不再做跳转，不再把用户带到新的页面。

- [ ] **Step 3: 把“编辑 / 删除”按钮保持在统一操作组里**

确保按钮仍然简洁克制，别把卡片压得太重。编辑按钮复用现有弹窗，删除按钮保持二次确认。

- [ ] **Step 4: 运行构建确认卡片布局没有撑坏**

```bash
npm run build
```

Expected: 卡片布局和图片预览都能通过构建。

---

### Task 4: 药品录入弹窗继续强化为“家庭药箱录入工具”

**Files:**
- Modify: `components/medicine-vault/medicine-entry-dialog.tsx`
- Modify: `app/api/medicines/route.ts`
- Modify: `app/api/medicines/[medicineId]/route.ts`
- Modify: `features/medicine-vault/medicine-request.ts`

- [ ] **Step 1: 让图片选择区域保持“选完就预览，点击可重选”**

保持当前本地上传逻辑不变：

- 选择图片后立即在弹窗中展示预览
- 点击预览图重新打开文件选择器
- 继续支持 AI 识别回填

- [ ] **Step 2: 让库存与位置更接近家庭药箱语义**

保存时继续写入：

- `quantity`
- `storageLocation`
- `usageNote`
- `safetyNote`

如果表单里暂时没有这些输入，也不要破坏现有保存链路。

- [ ] **Step 3: 保持保存后自动关闭弹窗**

这一步是防止重复提交的关键回归点。保存成功后必须：

```ts
setOpen(false)
resetDialog()
router.refresh()
```

- [ ] **Step 4: 做一次真实保存回归**

```bash
npm run build
```

然后在本地浏览器里手动验证：

1. 打开 `/medicines`
2. 新增一条药品
3. 上传图片
4. 识别并回填
5. 保存后弹窗关闭
6. 列表中出现新记录

Expected: 不重复生成多份结果。

---

### Task 5: 搜索、筛选、状态与提醒的设计落地

**Files:**
- Modify: `app/medicines/page.tsx`
- Modify: `features/medicine-vault/repository.ts`
- Modify: `features/medicine-vault/data.ts`

- [ ] **Step 1: 给页面预留筛选器入口**

筛选项先按 UI 预留：

- 状态
- 分类
- 存放位置
- 是否有图片

但第一版只要求搜索已经是真实数据库查询，筛选可以先是可点击外观，不强制马上写完所有逻辑。

- [ ] **Step 2: 定义状态优先级**

状态优先级采用：

1. 已过期
2. 库存不足
3. 即将过期
4. 正常

在页面顶部统计区展示四类状态中的关键数量。

- [ ] **Step 3: 定义空状态和异常状态文案**

空状态：

```tsx
没有找到匹配的药品记录，请换一个关键词试试。
```

异常状态保持中文提示，不把数据库错误直接暴露给用户。

- [ ] **Step 4: 跑一次浏览器验证**

```bash
npm run build
```

然后在本地浏览器中验证：

- 搜索关键词能命中真实数据
- 没有结果时会显示空状态
- 有图药品仍能直接预览

---

### Task 6: 可选的未来批次扩展准备

**Files:**
- Modify: `docs/product-requirements.md`（如果需要同步补充范围）
- Modify: `docs/system-architecture.md`（如果需要同步补充数据演进）
- Create: `docs/superpowers/specs/2026-04-26-medicine-batch-extension-notes.md`（仅在真的要开批次时）

- [ ] **Step 1: 先不要动数据库表结构**

这一版不增加批次表，先把主记录能力做稳。

- [ ] **Step 2: 在设计上记录未来扩展点**

未来若引入批次，优先在主记录之下挂扩展层，而不是推翻当前卡片和搜索结构。

- [ ] **Step 3: 只有当单条药品模式稳定后，再启动批次专案**

如果后续真的要做批次，再单独开一份设计文档和实现计划，不和当前升级混在一起。

---

## 验证清单

完成全部任务后，必须验证：

1. `npm run build` 通过
2. `/medicines` 页面正常渲染
3. `/medicines?q=布洛芬` 可以命中真实数据库药品
4. 上传图片后弹窗内能直接看到预览
5. 点击预览可以重新选择图片
6. 保存后弹窗会关闭，不会重复提交
7. 带图药品在卡片内直接显示原图
8. 没有图的药品仍然正常显示
9. 删除、编辑、搜索、AI 回填行为都不回归

## 交付标准

当以下状态同时成立时，这一轮升级可以结束：

- 药品页更像家庭药箱首页
- 搜索是真实数据库查询
- 图片在卡片内可见
- 录入弹窗的图片可以反复替换
- 现有主记录结构没有被推翻
- 后续批次能力仍然可以平滑接上
