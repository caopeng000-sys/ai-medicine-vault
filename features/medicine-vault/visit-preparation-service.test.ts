import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { generateVisitPreparation } from "./visit-preparation-service"

describe("visit preparation service", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  it("generates and stores a visit preparation draft for a member", async () => {
    const created: Array<{ concern: string; summary: string; questions: string[]; memberId: string }> = []

    const result = await generateVisitPreparation(
      ctx,
      {
        memberId: "member-cp",
        concern: "咳嗽低烧复诊前准备",
      },
      {
        getMemberById: async () => members[0],
        listMedicalRecords: async () => medicalRecords.filter((record) => record.memberId === "member-cp"),
        listMedicines: async () => medicines.filter((medicine) => medicine.memberId === "member-cp"),
        listAllergyRecords: async () => allergyRecords.filter((record) => record.memberId === "member-cp"),
        generateDraft: async () => ({
          concern: "咳嗽低烧复诊前准备",
          summary: "近期有上呼吸道感染记录，也有青霉素疑似过敏史。",
          questions: ["当前咳嗽是否需要进一步检查？", "青霉素过敏是否需要补充说明？"],
        }),
        createVisitPreparation: async (_ctx, input) => {
          created.push(input)
          return {
            userId: ctx.userId,
            memberId: input.memberId,
            concern: input.concern,
            summary: input.summary,
            questions: input.questions,
          }
        },
      },
    )

    assert.equal(result.concern, "咳嗽低烧复诊前准备")
    assert.equal(created.length, 1)
    assert.equal(created[0]?.memberId, "member-cp")
    assert.ok(result.questions.length >= 2)
  })
})
