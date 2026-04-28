import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { clampMedicinePage, paginateMedicines, sortMedicinesForDisplay } from "./medicine-pagination"

const sampleMedicines = [
  { id: "a", expiresAt: "2026-09-30", quantity: "1 盒" },
  { id: "b", expiresAt: "2026-04-20", quantity: "2 盒" },
  { id: "c", expiresAt: "2026-04-10", quantity: "1 盒" },
  { id: "d", expiresAt: "2026-05-10", quantity: "0 盒" },
  { id: "e", expiresAt: "2026-08-01", quantity: "3 盒" },
  { id: "f", expiresAt: "2026-06-01", quantity: "1 盒" },
  { id: "g", expiresAt: "2026-10-01", quantity: "4 盒" },
  { id: "h", expiresAt: "2026-07-15", quantity: "1 盒" },
  { id: "i", expiresAt: "2026-11-20", quantity: "2 盒" },
  { id: "j", expiresAt: "2026-12-31", quantity: "1 盒" },
  { id: "k", expiresAt: "2026-04-30", quantity: "5 盒" },
] as const

describe("medicine pagination helpers", () => {
  it("clamps page numbers into a valid range", () => {
    assert.equal(clampMedicinePage(0, 2), 1)
    assert.equal(clampMedicinePage(1, 2), 1)
    assert.equal(clampMedicinePage(5, 2), 2)
  })

  it("sorts medicines by the current display priority", () => {
    const sorted = sortMedicinesForDisplay(sampleMedicines)

    assert.equal(sorted[0]?.id, "c")
    assert.equal(sorted[1]?.id, "b")
    assert.equal(sorted[2]?.id, "d")
  })

  it("paginates six items per page and reports totals", () => {
    const result = paginateMedicines(sampleMedicines, { page: 2, pageSize: 6 })

    assert.equal(result.page, 2)
    assert.equal(result.pageSize, 6)
    assert.equal(result.total, 11)
    assert.equal(result.totalPages, 2)
    assert.equal(result.items.length, 5)
    assert.equal(result.items[0]?.id, "g")
  })
})
