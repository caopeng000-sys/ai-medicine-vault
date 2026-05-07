import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import {
  detectAssistantIntent,
  findAllergyHistory,
  findAntiallergicMedicines,
  findMedicineAllergyConflicts,
  findMedicineDisposalGuidance,
  findMedicineInteractionGuidance,
  findMedicineUsageGuidance,
  findRecentColdRecord,
  findRecentMedicineHistory,
  findSymptomHistory,
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

  it("parses medicine interaction intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"medicine_interaction","reason":"命中了相互作用意图"}')

    assert.equal(result.intent, "medicine_interaction")
    assert.equal(result.reason, "命中了相互作用意图")
  })

  it("parses medicine disposal intent from JSON text", () => {
    const result = parseAssistantIntent('{"intent":"medicine_disposal","reason":"命中了过期药处理意图"}')

    assert.equal(result.intent, "medicine_disposal")
    assert.equal(result.reason, "命中了过期药处理意图")
  })

  it("parses new assistant intents from JSON text", () => {
    assert.equal(parseAssistantIntent('{"intent":"recent_medicine_history","reason":"最近用药"}').intent, "recent_medicine_history")
    assert.equal(parseAssistantIntent('{"intent":"symptom_history","reason":"症状历史"}').intent, "symptom_history")
    assert.equal(parseAssistantIntent('{"intent":"medicine_allergy_conflict","reason":"过敏冲突"}').intent, "medicine_allergy_conflict")
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

  it("detects medicine interaction questions before medicine queries", () => {
    assert.equal(detectAssistantIntent("布洛芬和感冒灵能不能一起吃"), "medicine_interaction")
  })

  it("detects medicine disposal questions before medicine queries", () => {
    assert.equal(detectAssistantIntent("过期药怎么办"), "medicine_disposal")
  })

  it("detects medicine allergy conflicts before general medicine routing", () => {
    assert.equal(detectAssistantIntent("阿莫西林和我的过敏史有没有冲突"), "medicine_allergy_conflict")
  })

  it("detects recent medicine history questions", () => {
    assert.equal(detectAssistantIntent("我最近吃过哪些药？"), "recent_medicine_history")
    assert.equal(detectAssistantIntent("这段时间吃了什么药"), "recent_medicine_history")
  })

  it("detects symptom history without hijacking medicine inventory questions", () => {
    assert.equal(detectAssistantIntent("我之前咳嗽看过几次？"), "symptom_history")
    assert.equal(detectAssistantIntent("家里有哪些咳嗽药？"), "medicine_query")
  })

  it("finds medicine usage guidance records", () => {
    const result = findMedicineUsageGuidance(medicines, members, "布洛芬缓释胶囊怎么吃")

    assert.ok(result.length >= 1)
    assert.equal(result[0]?.medicine.id, "medicine-ibuprofen")
    assert.equal(result[0]?.member?.name, "曹鹏")
  })

  it("finds medicine interaction guidance records", () => {
    const result = findMedicineInteractionGuidance(medicines, members, "布洛芬和感冒灵能不能一起吃")

    assert.ok(result.length >= 1)
    assert.ok(result.some((item) => item.medicine.id === "medicine-ibuprofen"))
    assert.ok(result.some((item) => item.medicine.id === "medicine-cold-granule"))
  })

  it("finds medicine disposal guidance records", () => {
    const result = findMedicineDisposalGuidance(medicines, members, "过期药怎么办")

    assert.ok(result.length >= 1)
    assert.ok(result.some((item) => item.medicine.id === "medicine-cefixime"))
    assert.ok(result.every((item) => item.medicine.category !== "设备耗材"))
  })

  it("finds recent medicine history from medical records and medicine catalog", () => {
    const result = findRecentMedicineHistory(medicalRecords, medicines, members, "我最近吃过哪些药？")

    assert.ok(result.some((item) => item.record?.id === "record-20260412"))
    assert.ok(result.some((item) => item.record?.id === "record-20260308"))
    assert.ok(result.some((item) => item.medicine?.id === "medicine-ibuprofen"))
    assert.ok(result.some((item) => item.medicine?.id === "medicine-loratadine"))
    assert.equal(result[0]?.record?.id, "record-20260412")
  })

  it("finds symptom history records by symptom in reverse chronological order", () => {
    const result = findSymptomHistory(medicalRecords, members, "我之前鼻塞有没有就医？")

    assert.equal(result.length, 1)
    assert.equal(result[0]?.record.id, "record-20260308")
    assert.deepEqual(result[0]?.matchedSymptoms, ["鼻塞"])
  })

  it("finds medicine allergy conflicts against the target member allergy history", () => {
    const result = findMedicineAllergyConflicts(medicines, allergyRecords, members, "阿莫西林和我的过敏史有没有冲突？")

    assert.ok(result.length >= 1)
    assert.equal(result[0]?.medicine?.id, "medicine-amoxicillin")
    assert.equal(result[0]?.allergy?.id, "allergy-penicillin")
    assert.equal(result[0]?.member?.id, "member-cp")
    assert.match(result[0]?.riskText ?? "", /直接文本命中/)
  })

  it("returns relevant allergy history for allergy conflict checks without direct medicine hits", () => {
    const result = findMedicineAllergyConflicts([], allergyRecords, members, "用药前要不要注意过敏史？")

    assert.ok(result.length >= 1)
    assert.ok(result.some((item) => item.allergy?.id === "allergy-penicillin"))
    assert.ok(result.every((item) => item.riskText.length > 0))
  })
})
