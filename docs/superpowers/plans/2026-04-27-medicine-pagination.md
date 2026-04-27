# 药品管理分页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `/medicines` 按“先筛选、再分页”的方式工作，每页固定展示 6 条药品记录，并保留现有搜索、成员筛选与状态排序。

**Architecture:** 分页逻辑先抽成纯函数，再由药品仓储层和页面共同调用。后端返回分页元数据，mock 回退也用同一套规则，保证真实数据库和本地回退的行为一致。页面只负责渲染查询参数、分页器和列表，不自己重算分页。

**Tech Stack:** Next.js App Router, React Server Components, Prisma, PostgreSQL, TypeScript, shadcn/ui, Tailwind CSS.

---

### Task 1: Add reusable medicine pagination helpers

**Files:**
- Create: `features/medicine-vault/medicine-pagination.ts`
- Test: `features/medicine-vault/medicine-pagination.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { clampMedicinePage, paginateMedicines } from "./medicine-pagination"

const sampleMedicines = Array.from({ length: 11 }, (_, index) => ({
  id: `m-${index + 1}`,
  expiresAt: `2026-04-${String(index + 1).padStart(2, "0")}`,
}))

describe("medicine pagination helpers", () => {
  it("clamps page numbers into a valid range", () => {
    assert.equal(clampMedicinePage(0, 2), 1)
    assert.equal(clampMedicinePage(1, 2), 1)
    assert.equal(clampMedicinePage(5, 2), 2)
  })

  it("paginates six items per page and reports totals", () => {
    const result = paginateMedicines(sampleMedicines, { page: 2, pageSize: 6 })

    assert.equal(result.page, 2)
    assert.equal(result.pageSize, 6)
    assert.equal(result.total, 11)
    assert.equal(result.totalPages, 2)
    assert.equal(result.items.length, 5)
    assert.equal(result.items[0]?.id, "m-7")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec --yes tsx --test features/medicine-vault/medicine-pagination.test.ts`

Expected: FAIL because `clampMedicinePage` and `paginateMedicines` do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
export const DEFAULT_MEDICINE_PAGE_SIZE = 6

export function clampMedicinePage(page: number, totalPages: number) {
  return Math.min(Math.max(1, page), Math.max(1, totalPages))
}

export function paginateMedicines<T>(items: T[], { page, pageSize }: { page: number; pageSize: number }) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = clampMedicinePage(page, totalPages)
  const start = (currentPage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm exec --yes tsx --test features/medicine-vault/medicine-pagination.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add features/medicine-vault/medicine-pagination.ts features/medicine-vault/medicine-pagination.test.ts
git commit -m "feat: add medicine pagination helpers"
```

### Task 2: Add paginated medicine repository API

**Files:**
- Modify: `features/medicine-vault/repository.ts`
- Test: `features/medicine-vault/repository.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { listMedicinesPaginated } from "./repository"

describe("listMedicinesPaginated", () => {
  it("returns six items per page and total pages after filtering", async () => {
    const result = await listMedicinesPaginated({ page: 1, pageSize: 6 })

    assert.equal(result.page, 1)
    assert.equal(result.pageSize, 6)
    assert.equal(result.items.length, 6)
    assert.ok(result.total >= result.items.length)
    assert.ok(result.totalPages >= 1)
  })

  it("keeps member and keyword filters while paging", async () => {
    const result = await listMedicinesPaginated({
      memberId: "member-cp",
      query: "布洛芬",
      page: 1,
      pageSize: 6,
    })

    assert.equal(result.pageSize, 6)
    assert.ok(result.items.every((item) => item.memberId === "member-cp"))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec --yes tsx --test features/medicine-vault/repository.test.ts`

Expected: FAIL because `listMedicinesPaginated` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Add these types to `features/medicine-vault/repository.ts`:

```ts
type MedicinePageQuery = Readonly<{
  memberId?: string
  query?: string
  page: number
  pageSize: number
}>

type PaginatedMedicines = Readonly<{
  items: Medicine[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}>
```

Implement `listMedicinesPaginated(query)` so it:
- Reuses the existing medicine filtering rules.
- Sorts medicines with the current expiry-priority logic.
- Returns the current page via `paginateMedicines(...)` for mock data.
- Uses Prisma `count` + `findMany({ skip, take })` for database mode.
- Clamps page numbers that are too small or too large.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm exec --yes tsx --test features/medicine-vault/repository.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add features/medicine-vault/repository.ts features/medicine-vault/repository.test.ts
git commit -m "feat: add paginated medicine repository"
```

### Task 3: Wire `/medicines` page to pagination query params

**Files:**
- Modify: `app/medicines/page.tsx`
- Modify: `components/medicine-vault/medicine-entry-dialog.tsx`
- Modify: `features/medicine-vault/repository.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { listMedicinesPaginated } from "./repository"

describe("medicine pagination flow", () => {
  it("keeps the current filters when moving between pages", async () => {
    const firstPage = await listMedicinesPaginated({
      memberId: "member-cp",
      query: "布洛芬",
      page: 1,
      pageSize: 6,
    })
    const secondPage = await listMedicinesPaginated({
      memberId: "member-cp",
      query: "布洛芬",
      page: 2,
      pageSize: 6,
    })

    assert.equal(firstPage.pageSize, 6)
    assert.equal(secondPage.pageSize, 6)
    assert.equal(firstPage.total, secondPage.total)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm exec --yes tsx --test features/medicine-vault/repository.test.ts`

Expected: FAIL until the repository and page both use the new pagination helper consistently.

- [ ] **Step 3: Write the minimal implementation**

Update the page so it:
- Reads `page` from `searchParams`.
- Passes `page` and `pageSize: 6` into `listMedicinesPaginated(...)`.
- Keeps `member` and `q`.
- Resets `page` to `1` when search or member filter changes.
- Renders `上一页 / 下一页` and numbered page buttons.
- Shows `第 X / Y 页` and `共 N 条` style text.

Update the medicine entry dialog so that after a successful create:
- It keeps the current `member` filter.
- It clears `q`.
- It sets `page=1` so the new item is visible on the first page.

- [ ] **Step 4: Run the page/build verification**

Run:
`npm run build`

Expected: PASS with `/medicines` still compiling and pagination params preserved.

- [ ] **Step 5: Commit**

```bash
git add app/medicines/page.tsx components/medicine-vault/medicine-entry-dialog.tsx features/medicine-vault/repository.ts
git commit -m "feat: add medicine list pagination"
```

### Task 4: Final verification

**Files:**
- Modify: `docs/superpowers/specs/2026-04-27-medicine-pagination-design.md` if the implementation changes assumptions

- [ ] **Step 1: Run the final checks**

Run:
`npm exec --yes tsx --test features/medicine-vault/medicine-pagination.test.ts`
`npm exec --yes tsx --test features/medicine-vault/repository.test.ts`
`npm run build`

Expected: PASS for all three commands.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-04-27-medicine-pagination-design.md
git commit -m "docs: align medicine pagination spec"
```
