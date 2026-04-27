import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createAssistantQueryHandler } from "./route"

describe("assistant query route", () => {
  it("returns a JSON response for the assistant query", async () => {
    const handler = createAssistantQueryHandler(async () => ({
      intent: "medicine_query",
      answer: "家里有氯雷他定片。",
      sources: [{ label: "药品 · 氯雷他定片", detail: "抗过敏 · 曹鹏 · 缓解过敏性鼻炎" }],
    }))

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "家里有哪些抗过敏药" }),
      }),
    )

    const payload = (await response.json()) as {
      intent: string
      answer: string
      sources: Array<{ label: string; detail: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(payload.intent, "medicine_query")
    assert.equal(payload.answer, "家里有氯雷他定片。")
    assert.equal(payload.sources[0]?.label, "药品 · 氯雷他定片")
  })
})
