import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildMedicalRecordExtractionPrompt,
  extractMedicalRecordFromImage,
} from "./medical-record-extractor"

describe("extractMedicalRecordFromImage", () => {
  it("returns structured medical record fields for a clear report photo", async () => {
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
                  visitedAt: "2026-04-25",
                  hospital: "市立医院 / 呼吸科",
                  diagnosis: "上呼吸道感染倾向",
                  symptoms: "咳嗽 3 天，伴低热。",
                  advice: "多饮水，观察 3 天，如加重复诊。",
                  summary: "识别到就诊日期、医院科室、诊断和医生建议。",
                  warnings: ["症状持续时间识别不够清晰。"],
                  originalText: "市立医院 呼吸科 2026-04-25 上呼吸道感染",
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
      const result = await extractMedicalRecordFromImage(dataUrl)

      assert.equal(result.visitedAt, "2026-04-25")
      assert.equal(result.hospital, "市立医院 / 呼吸科")
      assert.equal(result.diagnosis, "上呼吸道感染倾向")
      assert.ok(result.symptoms)
      assert.ok(result.advice)
      assert.ok(result.summary)
      assert.equal(result.originalText, "市立医院 呼吸科 2026-04-25 上呼吸道感染")
      assert.deepEqual(result.warnings, ["症状持续时间识别不够清晰。"])
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

describe("buildMedicalRecordExtractionPrompt", () => {
  it("asks for visit date, hospital, diagnosis, symptoms and doctor advice", () => {
    const prompt = buildMedicalRecordExtractionPrompt()

    assert.match(prompt, /就诊日期/)
    assert.match(prompt, /医院与科室/)
    assert.match(prompt, /诊断/)
    assert.match(prompt, /症状/)
    assert.match(prompt, /医生建议/)
    assert.match(prompt, /低置信度/)
  })
})
