import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import {
  buildAllergyMatches,
  buildVisitPrepSources,
  detectAssistantIntent,
  findAntiallergicMedicines,
  findRecentColdRecord,
  parseAssistantIntent,
} from "./assistant-routing"

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

  it("parses allergy_query intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"allergy_query","reason":"命中了过敏记录意图"}')

    assert.equal(result.intent, "allergy_query")
  })

  it("detects allergy history questions separately from medicine inventory questions", () => {
    assert.equal(detectAssistantIntent("我之前对哪些药有过不适？"), "allergy_query")
    assert.equal(detectAssistantIntent("家里有哪些抗过敏药？"), "medicine_query")
  })

  it("builds allergy matches with member context", () => {
    const result = buildAllergyMatches(allergyRecords, members)

    assert.ok(result.length >= 2)
    assert.equal(result[0]?.record.allergen, "海鲜")
    assert.equal(result[0]?.member?.name, "小朋友")
  })

  it("detects visit preparation questions", () => {
    assert.equal(detectAssistantIntent("下次看医生前应该准备哪些问题？"), "visit_prep_query")
    assert.equal(detectAssistantIntent("咳嗽低烧复诊前应该问什么"), "visit_prep_query")
  })

  it("builds visit prep sources from records medicines and allergies", () => {
    const result = buildVisitPrepSources(members, medicalRecords, medicines, allergyRecords)

    assert.ok(result.some((source) => source.label.startsWith("病历")))
    assert.ok(result.some((source) => source.label.startsWith("过敏")))
    assert.ok(result.some((source) => source.label.startsWith("药品")))
  })
})
