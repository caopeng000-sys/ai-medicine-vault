import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { allergyRecords, healthDocumentChunks, medicalRecords, medicines, members } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { rebuildIndex } from "./health-chunk-index-service"
import { answerRagQuery } from "./rag-query-service"

describe("rag query service", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  afterEach(() => {
    healthDocumentChunks.length = 0
    delete process.env.DATABASE_URL
  })

  it("answers open-ended questions with retrieved sources", async () => {
    const result = await answerRagQuery(ctx, "曹鹏有没有青霉素过敏记录？", {
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
      listAllergyRecords: async () => allergyRecords,
      summarizeAnswer: async ({ sources }) => (sources.length > 0 ? "资料里提到了相关过敏记录。" : "没有找到相关资料。"),
    })
    assert.ok(result.sources.length >= 1)
  })

  it("prefers persisted indexed chunks when available", async () => {
    process.env.DATABASE_URL = ""
    await rebuildIndex(ctx)
    const result = await answerRagQuery(ctx, "曹鹏有没有青霉素过敏记录？", {
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
      listAllergyRecords: async () => allergyRecords,
      summarizeAnswer: async ({ sources }) => (sources.length > 0 ? "资料里提到了相关过敏记录。" : "没有找到相关资料。"),
    })
    assert.ok(result.sources.some((source) => source.label.includes("过敏")))
  })
})
