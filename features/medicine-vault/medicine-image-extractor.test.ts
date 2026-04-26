import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { extractMedicineFromImage } from "./medicine-image-extractor"
import { buildMedicineExtractionPrompt } from "./medicine-image-extractor"

describe("extractMedicineFromImage", () => {
  it("returns richer medicine fields for a clear medicine label", async () => {
    const dataUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
    const originalFetch = globalThis.fetch
    const originalApiKey = process.env.DASHSCOPE_API_KEY

    process.env.DASHSCOPE_API_KEY = "test-key"
    globalThis.fetch = (async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: "布洛芬缓释胶囊",
                  category: "止痛退烧",
                  dosage: "0.3g/粒",
                  specification: "0.3g * 20 粒",
                  instructions: "口服，每 12 小时 1 次。",
                  purpose: "用于缓解发热和疼痛。",
                  summary: "识别到药名、规格、剂量、用法和适应症。",
                  warnings: ["有效期未识别清楚。"],
                  originalText: "布洛芬缓释胶囊 0.3g/粒",
                }),
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )) as typeof fetch

    try {
      const result = await extractMedicineFromImage(dataUrl)

      assert.ok(result.name)
      assert.equal(result.category, "止痛退烧")
      assert.equal(result.dosage, "0.3g/粒")
      assert.ok(result.specification)
      assert.ok(result.instructions)
      assert.ok(result.purpose)
      assert.ok(result.summary)
      assert.equal(result.originalText, "布洛芬缓释胶囊 0.3g/粒")
      assert.deepEqual(result.warnings, ["有效期未识别清楚。"])
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

describe("buildMedicineExtractionPrompt", () => {
  it("asks for original text, summarized dosage, treatment range and confidence hints", () => {
    const prompt = buildMedicineExtractionPrompt()

    assert.match(prompt, /原文/)
    assert.match(prompt, /用法用量/)
    assert.match(prompt, /治疗范围/)
    assert.match(prompt, /低置信度/)
  })
})
