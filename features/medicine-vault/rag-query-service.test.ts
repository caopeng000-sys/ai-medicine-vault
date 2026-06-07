import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { answerRagQuery } from "./rag-query-service"

describe("rag query service", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  it("answers open-ended questions with retrieved sources", async () => {
    const result = await answerRagQuery(ctx, "曹鹏有没有青霉素过敏记录？", {
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
      listAllergyRecords: async () => allergyRecords,
      summarizeAnswer: async ({ sources }) =>
        sources.length > 0 ? "资料里提到了相关过敏记录。" : "没有找到相关资料。",
    })

    assert.ok(result.sources.length >= 1)
    assert.ok(result.answer.includes("过敏") || result.answer.includes("资料"))
  })
})
