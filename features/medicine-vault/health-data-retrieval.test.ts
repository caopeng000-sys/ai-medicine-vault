import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { allergyRecords, medicalRecords, medicines, members } from "./data"
import { indexHealthData } from "./health-data-indexer"
import { retrieveRelevantChunks, scoreChunk } from "./health-data-retrieval"

describe("health data indexer and retrieval", () => {
  it("indexes members records medicines and allergies into chunks", () => {
    const chunks = indexHealthData({
      members,
      records: medicalRecords,
      medicines,
      allergies: allergyRecords,
    })

    assert.ok(chunks.some((chunk) => chunk.sourceType === "member"))
    assert.ok(chunks.some((chunk) => chunk.sourceType === "record"))
    assert.ok(chunks.some((chunk) => chunk.sourceType === "medicine"))
    assert.ok(chunks.some((chunk) => chunk.sourceType === "allergy"))
  })

  it("retrieves cold-related record chunks for open-ended questions", () => {
    const chunks = indexHealthData({
      members,
      records: medicalRecords,
      medicines,
      allergies: allergyRecords,
    })

    const result = retrieveRelevantChunks("上次感冒是什么时候", chunks)

    assert.ok(result.length >= 1)
    assert.ok(result.some((chunk) => chunk.content.includes("上呼吸道感染") || chunk.content.includes("感冒")))
  })

  it("scores chunks with matching keywords", () => {
    const chunk = {
      id: "record-1",
      sourceType: "record" as const,
      sourceId: "record-1",
      title: "病历 · 上呼吸道感染",
      content: "曹鹏 2026-04-12 咳嗽 低烧 上呼吸道感染",
      href: "/records",
    }

    assert.ok(scoreChunk("曹鹏 咳嗽 记录", chunk) > 0)
  })
})
