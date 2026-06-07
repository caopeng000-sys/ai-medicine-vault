import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { extractMedicalAttachmentFromImage } from "./medical-attachment-extractor"

describe("extractMedicalAttachmentFromImage", () => {
  it("parses OCR response", async () => {
    const originalFetch = globalThis.fetch
    process.env.DASHSCOPE_API_KEY = "test"
    globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ extractedText: "化验单", reportType: "血常规" }) } }] }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch
    try {
      const result = await extractMedicalAttachmentFromImage("data:image/png;base64,x")
      assert.equal(result.extractedText, "化验单")
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
