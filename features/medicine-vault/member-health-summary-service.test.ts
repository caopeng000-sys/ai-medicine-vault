import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import {
  formatMemberHealthSummaryForCopy,
} from "./member-health-summary-shared"
import { generateMemberHealthSummary } from "./member-health-summary-service"

describe("member health summary service", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  it("generates a structured health summary for a member", async () => {
    const result = await generateMemberHealthSummary(ctx, "member-cp", {
      getMemberById: async () => members[0],
      listMedicalRecords: async () => medicalRecords.filter((record) => record.memberId === "member-cp"),
      listMedicines: async () => medicines.filter((medicine) => medicine.memberId === "member-cp"),
      listAllergyRecords: async () => allergyRecords.filter((record) => record.memberId === "member-cp"),
      generateSummary: async () => ({
        chronicTimeline: ["2026-03-01：上呼吸道感染（咳嗽、低烧）"],
        medicationSummary: "近期包括双黄连口服液。",
        allergyRisks: "青霉素（严重）：皮疹。",
        lastVisitHighlight: "最近一次为咳嗽低烧复诊。",
        doctorBrief: "成员有青霉素过敏史，近期上呼吸道感染就诊。",
      }),
    })

    assert.ok(result.doctorBrief.includes("青霉素"))
    assert.equal(result.chronicTimeline.length, 1)
    assert.ok(result.sources.length >= 1)
  })

  it("formats summary text for clipboard copy", async () => {
    const formatted = formatMemberHealthSummaryForCopy({
      chronicTimeline: ["2026-03-01：上呼吸道感染"],
      medicationSummary: "双黄连口服液",
      allergyRisks: "青霉素过敏",
      lastVisitHighlight: "咳嗽低烧复诊",
      doctorBrief: "30 秒摘要示例",
      sources: [],
    })

    assert.ok(formatted.includes("30 秒摘要示例"))
    assert.ok(formatted.includes("慢性病史"))
  })
})
