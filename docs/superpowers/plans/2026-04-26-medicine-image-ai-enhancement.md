# 药品图片 AI 回填增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让药品图片识别不只回填少量字段，而是先提取原文，再结构化总结出规格、吃法、治疗范围和注意事项，并把高置信度内容自动回填到药品表单。

**Architecture:** 保持现有“本地上传图片 -> 服务端识别 -> 用户确认保存”的主流程不变，只把识别器升级成两段式：先从图片里提取更完整的原始文字和结构化信息，再由模型基于原文总结成可回填字段。前端继续在弹窗中展示 AI 回填结果，但增加“原文摘要 / 回填建议 / 低置信度提醒”三个层次，减少用户手工补字段的负担，同时保留人工确认。

**Tech Stack:** Next.js App Router、React 19、TypeScript、Zod、阿里百炼 DashScope OpenAI 兼容接口、PostgreSQL、Prisma。

---

### Task 1: 定义更完整的识别结果结构和测试期望

**Files:**
- Modify: `features/medicine-vault/medicine-image-extractor.ts`
- Modify: `features/medicine-vault/schemas.ts`
- Test: `features/medicine-vault/medicine-image-extractor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { extractMedicineFromImage } from "./medicine-image-extractor"

describe("extractMedicineFromImage", () => {
  it("returns richer medicine fields for a clear medicine label", async () => {
    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    const result = await extractMedicineFromImage(dataUrl)

    assert.ok(result.name)
    assert.ok(result.specification)
    assert.ok(result.instructions)
    assert.ok(result.purpose)
    assert.ok(result.summary)
    assert.ok(Array.isArray(result.warnings))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec --yes tsx --test features/medicine-vault/medicine-image-extractor.test.ts`
Expected: FAIL because `summary` and richer normalization are not yet available.

- [ ] **Step 3: Write minimal implementation**

```ts
const extractedMedicineSchema = z.object({
  name: z.string().trim().default(""),
  category: z.string().trim().default(""),
  dosage: z.string().trim().default(""),
  specification: z.string().trim().default(""),
  instructions: z.string().trim().default(""),
  purpose: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  warnings: z.array(z.string().trim()).default([]),
  originalText: z.string().trim().default(""),
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm exec --yes tsx --test features/medicine-vault/medicine-image-extractor.test.ts`
Expected: PASS with the richer result shape.

- [ ] **Step 5: Commit**

```bash
git add features/medicine-vault/medicine-image-extractor.ts features/medicine-vault/schemas.ts features/medicine-vault/medicine-image-extractor.test.ts
git commit -m "feat: enrich medicine image extraction result"
```

### Task 2: Upgrade the model prompt to extract原文 + 总结 + 低置信度信息

**Files:**
- Modify: `features/medicine-vault/medicine-image-extractor.ts`
- Modify: `app/api/medicines/extract/route.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildMedicineExtractionPrompt } from "./medicine-image-extractor"

describe("buildMedicineExtractionPrompt", () => {
  it("asks for original text, summarized dosage, treatment range and confidence hints", () => {
    const prompt = buildMedicineExtractionPrompt()

    assert.match(prompt, /原文/)
    assert.match(prompt, /用法用量/)
    assert.match(prompt, /治疗范围/)
    assert.match(prompt, /低置信度/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec --yes tsx --test features/medicine-vault/medicine-image-extractor.test.ts`
Expected: FAIL because the prompt helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildMedicineExtractionPrompt() {
  return [
    "你是一个用于家庭药品资料整理的视觉识别助手。",
    "先尽量识别图片中的原文，再基于原文整理结构化字段。",
    "请返回原文、药名、规格、剂量、剂型、用法用量、治疗范围、注意事项、摘要和低置信度提醒。",
    "如果看不清，请返回空字符串，不要臆测。",
    "请严格返回 JSON，不要输出额外说明。",
  ].join("\n")
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm exec --yes tsx --test features/medicine-vault/medicine-image-extractor.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add features/medicine-vault/medicine-image-extractor.ts app/api/medicines/extract/route.ts
git commit -m "feat: improve medicine extraction prompt"
```

### Task 3: Extend the medicine dialog to auto-fill more fields and show AI suggestions separately

**Files:**
- Modify: `components/medicine-vault/medicine-entry-dialog.tsx`
- Modify: `features/medicine-vault/medicine-image-extractor.ts`
- Test: `components/medicine-vault/medicine-entry-dialog.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createElement } from "react"
import { buildMedicineSuggestionBlocks } from "./medicine-entry-dialog"

describe("buildMedicineSuggestionBlocks", () => {
  it("maps extraction output into auto-fill fields and suggestion chips", () => {
    const blocks = buildMedicineSuggestionBlocks({
      name: "布洛芬缓释胶囊",
      category: "止痛退烧",
      dosage: "0.3g/粒",
      specification: "0.3g × 20粒",
      instructions: "口服，每12小时一次。",
      purpose: "用于缓解发热和疼痛。",
      summary: "识别到药名、规格、适应症、吃法。",
      warnings: ["有效期未识别清楚。"],
      originalText: "布洛芬缓释胶囊 0.3g/粒",
    })

    assert.equal(blocks.autofill.name, "布洛芬缓释胶囊")
    assert.equal(blocks.autofill.instructions, "口服，每12小时一次。")
    assert.equal(blocks.suggestions.length, 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec --yes tsx --test components/medicine-vault/medicine-entry-dialog.test.tsx`
Expected: FAIL because suggestion mapping helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function buildMedicineSuggestionBlocks(result: ExtractedMedicineData) {
  return {
    autofill: {
      name: result.name,
      category: result.category,
      dosage: result.dosage,
      specification: result.specification,
      instructions: result.instructions,
      purpose: result.purpose,
    },
    suggestions: [
      result.summary,
      ...result.warnings,
    ].filter(Boolean),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm exec --yes tsx --test components/medicine-vault/medicine-entry-dialog.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/medicine-vault/medicine-entry-dialog.tsx features/medicine-vault/medicine-image-extractor.ts components/medicine-vault/medicine-entry-dialog.test.tsx
git commit -m "feat: surface richer medicine ai suggestions"
```

### Task 4: Verify the end-to-end medicine flow and document the result

**Files:**
- Modify: `docs/medicine-management-computer-use-regression.md`
- Create: `docs/medicine-management-ai-enhancement-checklist.md`

- [ ] **Step 1: Write the failing test / checklist item**

```md
- [ ] 上传一张药盒图片后，AI 至少自动回填：药名、规格、剂量、用法用量、治疗范围、注意事项
- [ ] 低置信度字段不会被硬写入，页面会展示建议而不是伪确定值
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS only after前面三个任务完成并把回填字段接通；当前如果未实现，会在手工回归里表现为字段缺失。

- [ ] **Step 3: Write minimal implementation**

```md
# 药品 AI 回填增强检查清单

- 上传药盒图片
- 点击 AI 识别
- 核对药名、规格、剂量、用法用量、治疗范围、注意事项
- 确认低置信度建议以提示形式展示
- 保存后记录可在列表页中再次查看
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/medicine-management-computer-use-regression.md docs/medicine-management-ai-enhancement-checklist.md
git commit -m "docs: add medicine ai enhancement checklist"
```

## Self-Review Checklist

- [ ] Every requirement from the approved spec maps to at least one task.
- [ ] No step contains TBD/TODO/placeholder language.
- [ ] Prompt helper, extraction parser, dialog mapping, and docs are all covered.
- [ ] Types and field names are consistent across extraction, UI, and persistence.
- [ ] Each task is small enough to implement and verify independently.

## Execution Notes

- Prefer one task per commit to keep regression isolated.
- Re-run `npm run build` after each task that changes UI or server behavior.
- Keep the existing manual-confirmation rule for medical data: AI may suggest, but the user still confirms before saving.
