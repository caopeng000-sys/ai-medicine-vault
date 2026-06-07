import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { healthDocumentChunks } from "./data"
import { cosineSimilarity, rankChunksByEmbedding, rebuildIndex, searchChunks } from "./health-chunk-index-service"
import { listHealthDocumentChunks } from "./repository"

const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

afterEach(() => {
  healthDocumentChunks.length = 0
  process.env.DATABASE_URL = ""
  delete process.env.DASHSCOPE_API_KEY
})

describe("health chunk index service", () => {
  it("computes cosine similarity", () => {
    assert.equal(cosineSimilarity([1, 0, 0], [1, 0, 0]), 1)
  })

  it("rebuilds and persists chunks without embeddings", async () => {
    const result = await rebuildIndex(ctx)
    assert.ok(result.indexed >= 4)
    assert.equal(result.embedded, 0)
    assert.ok((await listHealthDocumentChunks(ctx)).length >= 4)
  })

  it("searches with keyword fallback", async () => {
    await rebuildIndex(ctx)
    const results = await searchChunks(ctx, "曹鹏 青霉素 过敏")
    assert.ok(results.length >= 1)
  })

  it("ranks by cosine similarity", () => {
    const ranked = rankChunksByEmbedding([1, 0, 0], [
      { id: "a", userId: ctx.userId, sourceType: "allergy", sourceId: "a", title: "过敏 · 青霉素", content: "x", embedding: [1, 0, 0], createdAt: "", updatedAt: "" },
      { id: "b", userId: ctx.userId, sourceType: "medicine", sourceId: "b", title: "药品 · 布洛芬", content: "y", embedding: [0, 1, 0], createdAt: "", updatedAt: "" },
    ], 1)
    assert.match(ranked[0]!.title, /青霉素/)
  })
})
