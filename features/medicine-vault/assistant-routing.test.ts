import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { medicalRecords, medicines, members } from "./data"
import {
  detectAssistantIntent,
  findAllergyHistory,
  findAntiallergicMedicines,
  findMedicineUsageGuidance,
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

  it("parses allergy history intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"allergy_history","reason":"命中了过敏史意图"}')

    assert.equal(result.intent, "allergy_history")
    assert.equal(result.reason, "命中了过敏史意图")
  })

  it("parses medicine usage intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"medicine_usage","reason":"命中了用药说明意图"}')

    assert.equal(result.intent, "medicine_usage")
    assert.equal(result.reason, "命中了用药说明意图")
  })

  it("finds allergy history records for self-related questions", () => {
    const result = findAllergyHistory(
      [
        {
          id: "allergy-penicillin",
          userId: "user-development",
          memberId: "member-cp",
          allergen: "青霉素",
          reaction: "既往使用后出现皮疹",
          severity: "中等",
          discoveredAt: "2012-08-10",
          note: "就医前需要主动告知医生。",
        },
      ],
      members,
      "我之前对哪些药有过不适",
    )

    assert.equal(result.length, 1)
    assert.equal(result[0]?.record.allergen, "青霉素")
    assert.equal(result[0]?.member?.name, "曹鹏")
  })

  it("detects visit preparation questions", () => {
    const result = detectAssistantIntent("下次看医生前要准备什么")

    assert.equal(result, "visit_preparation")
  })

  it("detects allergy history questions before medicine queries", () => {
    assert.equal(detectAssistantIntent("我之前对哪些药有过不适"), "allergy_history")
  })

  it("detects medicine usage questions before medicine queries", () => {
    assert.equal(detectAssistantIntent("布洛芬缓释胶囊怎么吃"), "medicine_usage")
  })

  it("finds medicine usage guidance records", () => {
    const result = findMedicineUsageGuidance(medicines, members, "布洛芬缓释胶囊怎么吃")

    assert.ok(result.length >= 1)
    assert.equal(result[0]?.medicine.id, "medicine-ibuprofen")
    assert.equal(result[0]?.member?.name, "曹鹏")
  })
})
