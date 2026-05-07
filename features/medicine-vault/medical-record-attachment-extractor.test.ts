import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildMedicalRecordAttachmentExtractionPrompt,
  extractMedicalRecordAttachmentFromImage,
} from "./medical-record-attachment-extractor"

describe("buildMedicalRecordAttachmentExtractionPrompt", () => {
  it("keeps the extraction scoped to records organization instead of diagnosis", () => {
    const prompt = buildMedicalRecordAttachmentExtractionPrompt()

    assert.match(prompt, /病历资料整理/)
    assert.match(prompt, /不替代医生判断/)
    assert.match(prompt, /keyFindings/)
    assert.match(prompt, /warnings/)
  })
})

describe("extractMedicalRecordAttachmentFromImage", () => {
  it("parses structured attachment summaries from DashScope", async () => {
    const originalFetch = globalThis.fetch
    const originalApiKey = process.env.DASHSCOPE_API_KEY

    process.env.DASHSCOPE_API_KEY = "test-key"
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  documentType: "检查报告",
                  summary: "识别到一份血常规报告。",
                  keyFindings: ["白细胞轻度升高", "医生建议复查"],
                  suggestedFollowUp: "按报告提示复查。",
                  originalText: "血常规 白细胞",
                  warnings: ["部分指标不清晰"],
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )) as typeof fetch

    try {
      const result = await extractMedicalRecordAttachmentFromImage(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
      )

      assert.equal(result.documentType, "检查报告")
      assert.equal(result.keyFindings[0], "白细胞轻度升高")
      assert.equal(result.warnings[0], "部分指标不清晰")
    } finally {
      globalThis.fetch = originalFetch
      if (originalApiKey === undefined) {
        delete process.env.DASHSCOPE_API_KEY
      } else {
        process.env.DASHSCOPE_API_KEY = originalApiKey
      }
    }
  })
})
