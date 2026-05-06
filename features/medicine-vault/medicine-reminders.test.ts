import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { buildMedicineReminderSummary } from "./medicine-reminders"

describe("buildMedicineReminderSummary", () => {
  it("summarizes urgent medicines using the shared medicine status rules", () => {
    const summary = buildMedicineReminderSummary([
      {
        id: "expired",
        userId: "user-development",
        memberId: "member-a",
        name: "已过期药品",
        category: "测试",
        dosage: "1片",
        instructions: "",
        purpose: "",
        specification: "",
        quantity: "3 盒",
        expiresAt: "2026-04-24",
        storageLocation: "抽屉",
        usageNote: "",
        safetyNote: "",
      },
      {
        id: "low-stock",
        userId: "user-development",
        memberId: "member-b",
        name: "库存不足药品",
        category: "测试",
        dosage: "1片",
        instructions: "",
        purpose: "",
        specification: "",
        quantity: "1 盒",
        expiresAt: "2026-06-20",
        storageLocation: "药箱",
        usageNote: "",
        safetyNote: "",
      },
      {
        id: "expiring-soon",
        userId: "user-development",
        memberId: "member-c",
        name: "即将过期药品",
        category: "测试",
        dosage: "1片",
        instructions: "",
        purpose: "",
        specification: "",
        quantity: "2 盒",
        expiresAt: "2026-05-05",
        storageLocation: "柜子",
        usageNote: "",
        safetyNote: "",
      },
      {
        id: "normal",
        userId: "user-development",
        memberId: "member-d",
        name: "状态正常药品",
        category: "测试",
        dosage: "1片",
        instructions: "",
        purpose: "",
        specification: "",
        quantity: "2 盒",
        expiresAt: "2026-09-01",
        storageLocation: "柜子",
        usageNote: "",
        safetyNote: "",
      },
    ])

    assert.equal(summary.total, 3)
    assert.equal(summary.expiredCount, 1)
    assert.equal(summary.lowStockCount, 1)
    assert.equal(summary.expiringSoonCount, 1)
    assert.equal(summary.items[0]?.id, "expired")
    assert.equal(summary.items[1]?.id, "low-stock")
    assert.equal(summary.items[2]?.id, "expiring-soon")
    assert.equal(summary.items.some((item) => item.id === "normal"), false)
    assert.equal(summary.items[0]?.message, "已过期 1 天")
    assert.equal(summary.items[1]?.message, "库存剩 1 盒")
    assert.equal(summary.items[2]?.message, "距离过期 10 天")
  })
})
