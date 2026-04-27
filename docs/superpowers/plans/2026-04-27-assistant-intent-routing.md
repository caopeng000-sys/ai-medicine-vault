# AI 助手意图路由 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 AI 助手先识别两个固定意图，再基于病历和药品库返回带来源依据的答案。

**Architecture:** 后端新增一个查询路由，先调用阿里百炼做意图识别，再按意图去查真实数据库中的病历或药品记录，最后把结果整理成可读答案返回前端。前端 `assistant` 页面改成真实问答表单和结果面板，支持输入、发送、加载中、来源展示和兜底提示。

**Tech Stack:** Next.js App Router, React Client Components, TypeScript, Prisma, 阿里百炼兼容模式 API, existing medicine-vault repository helpers.

---

### Task 1: Add assistant domain helpers and tests

**Files:**
- Create: `features/medicine-vault/assistant-routing.ts`
- Create: `features/medicine-vault/assistant-routing.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, expect, it } from "node:test"

import { findAntiallergicMedicines, findRecentColdRecord, parseAssistantIntent } from "./assistant-routing"
import { medicalRecords, medicines, members } from "./data"

describe("assistant routing helpers", () => {
  it("finds the latest cold-related medical record", () => {
    const result = findRecentColdRecord(medicalRecords, members)
    expect(result?.record.id).toBe("record-20260412")
    expect(result?.member.name).toBe("曹鹏")
  })

  it("finds allergy medicines by category and purpose", () => {
    const result = findAntiallergicMedicines(medicines, members)
    expect(result.map((item) => item.medicine.id)).toContain("medicine-loratadine")
  })

  it("parses assistant intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"antiallergic_medicine_query","reason":"命中了抗过敏药意图"}')
    expect(result.intent).toBe("antiallergic_medicine_query")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec --yes tsx --test features/medicine-vault/assistant-routing.test.ts`
Expected: FAIL because `assistant-routing.ts` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement the helpers in `features/medicine-vault/assistant-routing.ts`:

```typescript
import type { MedicalRecord, Medicine, Member } from "./data"

export type AssistantIntent = "recent_cold_record" | "antiallergic_medicine_query" | "unsupported"

export function parseAssistantIntent(rawText: string): { intent: AssistantIntent; reason: string } {
  const parsed = JSON.parse(rawText) as { intent?: AssistantIntent; reason?: string }
  return {
    intent: parsed.intent ?? "unsupported",
    reason: parsed.reason ?? "未返回原因",
  }
}

export function findRecentColdRecord(records: MedicalRecord[], members: Member[]) {
  const coldKeywords = ["感冒", "上呼吸道感染", "流涕", "鼻塞", "咳嗽", "发热"]
  const matches = records
    .filter((record) =>
      coldKeywords.some((keyword) =>
        [record.symptoms, record.diagnosis, record.doctorAdvice, record.prescriptionNote, record.note].join(" ").includes(keyword),
      ),
    )
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))

  const record = matches[0]
  if (!record) return undefined

  const member = members.find((item) => item.id === record.memberId)
  return { record, member }
}

export function findAntiallergicMedicines(medicines: Medicine[], members: Member[]) {
  const allergyKeywords = ["抗过敏", "过敏性鼻炎", "过敏", "荨麻疹", "打喷嚏", "流清涕"]
  return medicines
    .filter((medicine) => {
      const text = [medicine.category, medicine.purpose, medicine.instructions, medicine.usageNote, medicine.safetyNote]
        .join(" ")
        .trim()
      return text.includes("抗过敏") || allergyKeywords.some((keyword) => text.includes(keyword))
    })
    .map((medicine) => ({
      medicine,
      member: members.find((item) => item.id === medicine.memberId),
    }))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm exec --yes tsx --test features/medicine-vault/assistant-routing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add features/medicine-vault/assistant-routing.ts features/medicine-vault/assistant-routing.test.ts
git commit -m "feat: add assistant routing helpers"
```

### Task 2: Add the assistant query API

**Files:**
- Create: `app/api/assistant/query/route.ts`
- Modify: `lib/ai/dashscope.ts`
- Modify: `features/medicine-vault/repository.ts`

- [ ] **Step 1: Write the failing test for the route payload**

Use a direct route test by calling the handler function with a mock request object that contains `question: "家里有哪些抗过敏药"` and assert the JSON body includes `intent` and `sources`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec --yes tsx --test app/api/assistant/query/route.test.ts`
Expected: FAIL because the route does not exist yet.

- [ ] **Step 3: Implement the route**

The route should:

1. Read `question` from POST body.
2. Call `createDashscopeChatCompletion` with a compact system prompt that returns JSON intent only.
3. Parse the JSON using `parseAssistantIntent`.
4. If intent is `recent_cold_record`, call `listMedicalRecords()` and `listMembers()`, then `findRecentColdRecord(...)`.
5. If intent is `antiallergic_medicine_query`, call `listMedicines()` and `listMembers()`, then `findAntiallergicMedicines(...)`.
6. Build a short answer string with source labels and return it.
7. If the intent is unsupported or empty, return the friendly fallback text.

Use this response shape:

```typescript
{
  intent: AssistantIntent
  answer: string
  message?: string
  sources: Array<{ label: string; detail: string }>
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm exec --yes tsx --test app/api/assistant/query/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/assistant/query/route.ts lib/ai/dashscope.ts features/medicine-vault/repository.ts
git commit -m "feat: add assistant query api"
```

### Task 3: Rebuild the assistant page as a real chat surface

**Files:**
- Modify: `app/assistant/page.tsx`
- Create: `components/medicine-vault/assistant-panel.tsx`

- [ ] **Step 1: Write the failing browser-level expectation**

The page should render:

1. A question input
2. A send button
3. A result card that shows the answer
4. A source list
5. A friendly unsupported-message state

- [ ] **Step 2: Run the page manually and verify the missing state**

Open `/assistant` in the in-app browser and confirm the current static prototype is replaced by a real query surface.

- [ ] **Step 3: Implement the client panel**

Use a client component with:

```typescript
const [question, setQuestion] = useState("")
const [loading, setLoading] = useState(false)
const [result, setResult] = useState<AssistantQueryResponse | null>(null)
```

Submit to `/api/assistant/query`, render loading state, then show:

- answer
- sources
- unsupported message when returned
- error note when fetch fails

- [ ] **Step 4: Verify the build and browser flow**

Run: `npm run build`

Then open `/assistant` and test:

- “我上次什么时候感冒”
- “家里有哪些抗过敏药”
- 一个不支持的问题

Expected: all three paths render cleanly.

- [ ] **Step 5: Commit**

```bash
git add app/assistant/page.tsx components/medicine-vault/assistant-panel.tsx
git commit -m "feat: make assistant page query-driven"
```

### Task 4: Verify and summarize

**Files:**
- No new files

- [ ] **Step 1: Run the full verification**

Run:

```bash
npm exec --yes tsx --test features/medicine-vault/assistant-routing.test.ts
npm exec --yes tsx --test app/api/assistant/query/route.test.ts
npm run build
```

- [ ] **Step 2: Check the browser**

Open `/assistant` and confirm:

- `我上次什么时候感冒` returns the latest matching medical record with source
- `家里有哪些抗过敏药` returns the allergy medicines with source
- unsupported questions get the friendly fallback

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: connect assistant intent routing"
```

