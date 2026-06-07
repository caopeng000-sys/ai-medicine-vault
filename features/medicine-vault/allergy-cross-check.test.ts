import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords } from "./data"
import {
  crossCheckMedicineAgainstAllergies,
  crossCheckMedicineForMember,
} from "./allergy-cross-check"

describe("crossCheckMedicineAgainstAllergies", () => {
  it("flags penicillin-related medicine text against penicillin allergy", () => {
    const result = crossCheckMedicineForMember(
      "member-cp",
      {
        name: "阿莫西林胶囊",
        purpose: "用于敏感菌引起的感染。",
        warnings: [],
        originalText: "阿莫西林胶囊 0.25g",
      },
      allergyRecords,
    )

    assert.equal(result.hasRisk, true)
    assert.equal(result.warnings.length, 1)
    assert.equal(result.warnings[0]?.allergen, "青霉素")
    assert.equal(result.warnings[0]?.allergyRecordId, "allergy-penicillin")
    assert.ok(result.warnings[0]?.matchedTerms.includes("阿莫西林"))
    assert.ok(result.warnings[0]?.matchedFields.includes("name"))
    assert.match(result.warnings[0]?.message ?? "", /青霉素/)
    assert.match(result.disclaimer, /不构成诊断/)
  })

  it("returns no warnings when medicine text does not overlap with member allergies", () => {
    const result = crossCheckMedicineForMember(
      "member-cp",
      {
        name: "布洛芬缓释胶囊",
        purpose: "用于缓解发热和疼痛。",
        warnings: [],
        originalText: "布洛芬缓释胶囊 0.3g",
      },
      allergyRecords,
    )

    assert.equal(result.hasRisk, false)
    assert.deepEqual(result.warnings, [])
  })

  it("matches allergen terms inside warnings and original text", () => {
    const result = crossCheckMedicineAgainstAllergies(
      {
        name: "复方感冒颗粒",
        purpose: "缓解感冒症状。",
        warnings: ["说明书提示对海鲜过敏者慎用。"],
        originalText: "",
      },
      allergyRecords.filter((record) => record.memberId === "member-child"),
    )

    assert.equal(result.hasRisk, true)
    assert.equal(result.warnings[0]?.allergen, "海鲜")
    assert.ok(result.warnings[0]?.matchedFields.some((field) => field.startsWith("warnings")))
  })

  it("does not cross-match allergies from other members", () => {
    const result = crossCheckMedicineForMember(
      "member-cp",
      {
        name: "海鲜风味补充剂",
        purpose: "营养补充。",
        warnings: [],
        originalText: "含虾蟹提取物",
      },
      allergyRecords,
    )

    assert.equal(result.hasRisk, false)
  })

  it("includes allergen reference details in each warning", () => {
    const result = crossCheckMedicineForMember(
      "member-cp",
      {
        name: "青霉素V钾片",
        purpose: "抗感染",
        warnings: [],
        originalText: "",
      },
      allergyRecords,
    )

    assert.equal(result.warnings[0]?.severity, "中等")
    assert.match(result.warnings[0]?.reaction ?? "", /皮疹/)
  })
})
