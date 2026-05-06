import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { AllergyRecord, MedicalRecord, Member, Medicine } from "./data"
import { buildHealthReminderSummary } from "./health-reminders"

const members: Member[] = [
  {
    id: "member-a",
    userId: "user-development",
    name: "曹鹏",
    relationship: "本人",
    birthYear: 1994,
    gender: "男",
    allergySummary: "",
    note: "",
  },
]

const baseMedicine: Medicine = {
  id: "medicine-expired",
  userId: "user-development",
  memberId: "member-a",
  name: "过期药",
  category: "测试",
  dosage: "",
  instructions: "",
  purpose: "",
  specification: "",
  quantity: "2 盒",
  expiresAt: "2026-04-20",
  storageLocation: "药箱",
  usageNote: "",
  safetyNote: "",
}

const baseRecord: MedicalRecord = {
  id: "record-follow-up",
  userId: "user-development",
  memberId: "member-a",
  visitedAt: "2026-04-20",
  hospitalName: "社区门诊",
  department: "全科",
  symptoms: "咳嗽",
  diagnosis: "上呼吸道感染",
  clinicalSummary: "复诊观察咳嗽变化",
  examinationResults: "",
  followUpAt: "2026-04-26",
  doctorAdvice: "必要时复诊",
  prescriptionNote: "",
  note: "",
}

const baseAllergy: AllergyRecord = {
  id: "allergy-penicillin",
  userId: "user-development",
  memberId: "member-a",
  allergen: "青霉素",
  reaction: "皮疹",
  severity: "严重",
  discoveredAt: "2026-01-01",
  note: "就医前说明",
}

describe("buildHealthReminderSummary", () => {
  it("combines medicine, follow-up and allergy reminders by priority", () => {
    const summary = buildHealthReminderSummary({
      medicines: [baseMedicine],
      records: [baseRecord],
      allergies: [baseAllergy],
      members,
      referenceDate: new Date("2026-04-25T00:00:00+08:00"),
    })

    assert.equal(summary.total, 3)
    assert.equal(summary.highCount, 2)
    assert.equal(summary.mediumCount, 1)
    assert.equal(summary.lowCount, 0)
    assert.equal(summary.medicineCount, 1)
    assert.equal(summary.followUpCount, 1)
    assert.equal(summary.allergyCount, 1)
    assert.deepEqual(
      summary.items.map((item) => item.kind),
      ["过敏", "药品", "复诊"]
    )
    assert.equal(summary.items[0]?.title, "青霉素")
    assert.equal(summary.items[1]?.message, "已过期 5 天")
    assert.equal(summary.items[2]?.message, "距离复诊 1 天")
  })

  it("skips mild allergies and far future follow-ups", () => {
    const summary = buildHealthReminderSummary({
      medicines: [],
      records: [{ ...baseRecord, id: "future", followUpAt: "2026-06-01" }],
      allergies: [{ ...baseAllergy, id: "mild", severity: "轻微" }],
      members,
      referenceDate: new Date("2026-04-25T00:00:00+08:00"),
    })

    assert.equal(summary.total, 0)
  })
})
