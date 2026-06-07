import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { createEmbedding, createEmbeddings, isDashscopeEmbeddingConfigured } from "./dashscope-embedding.ts"

const originalApiKey = process.env.DASHSCOPE_API_KEY

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.DASHSCOPE_API_KEY
  else process.env.DASHSCOPE_API_KEY = originalApiKey
})

describe("dashscope embedding", () => {
  it("reports unavailable when api key is missing", () => {
    delete process.env.DASHSCOPE_API_KEY
    assert.equal(isDashscopeEmbeddingConfigured(), false)
  })

  it("returns null embeddings when api key is missing", async () => {
    delete process.env.DASHSCOPE_API_KEY
    assert.equal(await createEmbedding("测试文本"), null)
    assert.equal(await createEmbeddings(["测试文本", "第二条"]), null)
  })
})
