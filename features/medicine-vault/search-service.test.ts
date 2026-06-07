import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { searchVault } from "./search-service"

describe("search service", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  it("returns categorized results for medicine and allergy queries", async () => {
    const result = await searchVault(ctx, "过敏", {
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
      listAllergyRecords: async () => allergyRecords,
      summarizeResults: async ({ query, results }) => `summary:${query}:${results.length}`,
    })

    assert.ok(result.counts.medicines >= 1)
    assert.ok(result.counts.allergies >= 1)
    assert.ok(result.results.some((item) => item.category === "medicine"))
    assert.ok(result.results.some((item) => item.category === "allergy"))
    assert.equal(result.summary, "summary:过敏:7")
  })

  it("returns an empty summary when nothing matches", async () => {
    const result = await searchVault(ctx, "不存在的关键词", {
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
      listAllergyRecords: async () => allergyRecords,
      summarizeResults: async ({ query }) => `empty:${query}`,
    })

    assert.equal(result.results.length, 0)
    assert.equal(result.summary, "empty:不存在的关键词")
  })
})
