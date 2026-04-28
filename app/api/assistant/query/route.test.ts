import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { DEFAULT_DEVELOPMENT_USER } from "@/features/medicine-vault/auth-context"

import { createAssistantQueryHandler } from "./route"

describe("assistant query route", () => {
  it("returns a JSON response for the assistant query", async () => {
    const handler = createAssistantQueryHandler(
      async () => ({
        intent: "medicine_query",
        answer: "家里有氯雷他定片。",
        sources: [{ label: "药品 · 氯雷他定片", detail: "抗过敏 · 曹鹏 · 缓解过敏性鼻炎" }],
      }),
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

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

  it("passes the current repository context to the assistant service", async () => {
    const handler = createAssistantQueryHandler(
      async (ctx, question) => ({
        intent: "medicine_query",
        answer: `${ctx.userId}:${question}`,
        sources: [],
      }),
      async () => ({ userId: "user-current" }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "家里有哪些抗过敏药" }),
      }),
    )

    const payload = (await response.json()) as { answer: string }

    assert.equal(response.status, 200)
    assert.equal(payload.answer, "user-current:家里有哪些抗过敏药")
  })

  it("rejects overlong questions before calling the assistant service", async () => {
    let called = false
    const handler = createAssistantQueryHandler(
      async () => {
        called = true
        return {
          intent: "medicine_query",
          answer: "不应调用",
          sources: [],
        }
      },
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "药".repeat(1201) }),
      }),
    )
    const payload = (await response.json()) as { message: string }

    assert.equal(response.status, 400)
    assert.equal(called, false)
    assert.match(payload.message, /1200/)
  })

  it("returns a friendly fallback without leaking internal AI errors", async () => {
    const handler = createAssistantQueryHandler(
      async () => {
        throw new Error("DASHSCOPE_API_KEY=secret stack trace")
      },
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "家里有哪些抗过敏药" }),
      }),
    )
    const payload = (await response.json()) as { message: string }

    assert.equal(response.status, 502)
    assert.match(payload.message, /暂时不可用/)
    assert.doesNotMatch(payload.message, /DASHSCOPE_API_KEY/)
  })
})
