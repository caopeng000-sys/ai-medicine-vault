import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { medicalRecords, medicines, members } from "./data"
import { findAntiallergicMedicines, findRecentColdRecord, parseAssistantIntent } from "./assistant-routing"

describe("assistant routing helpers", () => {
  it("finds the latest cold-related medical record", () => {
    const result = findRecentColdRecord(medicalRecords, members)

    assert.ok(result)
    assert.equal(result?.record.id, "record-20260412")
    assert.equal(result?.member?.name, "曹鹏")
  })

  it("finds allergy medicines by category and symptom hints", () => {
    const result = findAntiallergicMedicines(medicines, members)

    assert.ok(result.length >= 1)
    assert.ok(result.some((item) => item.medicine.id === "medicine-loratadine"))
  })

  it("parses assistant intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"medicine_query","reason":"命中了药品查询意图"}')

    assert.equal(result.intent, "medicine_query")
    assert.equal(result.reason, "命中了药品查询意图")
  })
})
