import assert from "node:assert/strict"
import { describe, it } from "node:test"

import type { KnowledgeDocumentWithChunks } from "@/features/medicine-vault/repository"

import { buildKnowledgePageModel } from "./page"

function makeDocument(overrides: Partial<KnowledgeDocumentWithChunks> & Pick<KnowledgeDocumentWithChunks, "id" | "title" | "category" | "source" | "content" | "createdAt" | "updatedAt" | "chunks">): KnowledgeDocumentWithChunks {
  return {
    userId: "user-development",
    ...overrides,
  }
}

describe("knowledge page model", () => {
  it("sorts the newest documents first and builds readable previews", () => {
    const model = buildKnowledgePageModel([
      makeDocument({
        id: "older",
        title: "旧文档",
        category: "家庭记录",
        source: "家庭整理",
        content: "这是一段比较长的旧文档内容，用于说明页面会截断预览文本。",
        createdAt: "2026-04-20T08:00:00.000Z",
        updatedAt: "2026-04-20T08:00:00.000Z",
        chunks: [],
      }),
      makeDocument({
        id: "newer",
        title: "新文档",
        category: "用药提醒",
        source: "门诊总结",
        content: "新文档内容更靠前。",
        createdAt: "2026-04-22T08:00:00.000Z",
        updatedAt: "2026-04-22T08:00:00.000Z",
        chunks: [
          {
            id: "chunk-1",
            userId: "user-development",
            documentId: "newer",
            chunkIndex: 0,
            content: "新文档内容更靠前。",
            keywords: ["新文档"],
            createdAt: "2026-04-22T08:00:00.000Z",
            updatedAt: "2026-04-22T08:00:00.000Z",
          },
        ],
      }),
    ])

    assert.equal(model.totalDocuments, 2)
    assert.equal(model.totalCategories, 2)
    assert.equal(model.documents[0]?.id, "newer")
    assert.equal(model.documents[0]?.chunkCount, 1)
    assert.ok(model.documents[0]?.preview.includes("新文档内容更靠前"))
    assert.equal(model.documents[1]?.id, "older")
  })
})
