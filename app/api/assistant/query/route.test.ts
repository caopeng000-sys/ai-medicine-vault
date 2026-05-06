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
        sources: [{ label: "药品 · 氯雷他定片", detail: "抗过敏 · 曹鹏 · 缓解过敏性鼻炎", memberId: "member-cp" }],
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
      sources: Array<{ label: string; detail: string; memberId: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(payload.intent, "medicine_query")
    assert.equal(payload.answer, "家里有氯雷他定片。")
    assert.equal(payload.sources[0]?.label, "药品 · 氯雷他定片")
    assert.equal(payload.sources[0]?.memberId, "member-cp")
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

  it("returns visit preparation answers unchanged", async () => {
    const handler = createAssistantQueryHandler(
      async () => ({
        intent: "visit_preparation",
        answer: "就医前要整理病历和药品。",
        sources: [{ label: "就医准备 · 曹鹏", detail: "咳嗽低烧复诊前准备 · 需要说明已使用药品", memberId: "member-cp" }],
      }),
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "下次看医生前要准备什么？" }),
      }),
    )

    const payload = (await response.json()) as {
      intent: string
      answer: string
      sources: Array<{ label: string; detail: string; memberId: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(payload.intent, "visit_preparation")
    assert.equal(payload.answer, "就医前要整理病历和药品。")
    assert.equal(payload.sources[0]?.label, "就医准备 · 曹鹏")
    assert.equal(payload.sources[0]?.memberId, "member-cp")
  })

  it("returns allergy history answers unchanged", async () => {
    const handler = createAssistantQueryHandler(
      async () => ({
        intent: "allergy_history",
        answer: "青霉素曾经引起皮疹。",
        sources: [{ label: "过敏记录 · 曹鹏 · 青霉素", detail: "中等 · 既往使用后出现皮疹 / 就医前需要主动告知医生。", memberId: "member-cp" }],
      }),
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "我之前对哪些药有过不适？" }),
      }),
    )

    const payload = (await response.json()) as {
      intent: string
      answer: string
      sources: Array<{ label: string; detail: string; memberId: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(payload.intent, "allergy_history")
    assert.equal(payload.answer, "青霉素曾经引起皮疹。")
    assert.equal(payload.sources[0]?.label, "过敏记录 · 曹鹏 · 青霉素")
    assert.equal(payload.sources[0]?.memberId, "member-cp")
  })

  it("returns medicine usage answers unchanged", async () => {
    const handler = createAssistantQueryHandler(
      async () => ({
        intent: "medicine_usage",
        answer: "布洛芬缓释胶囊建议按说明或医嘱使用。",
        sources: [{ label: "用药说明 · 曹鹏 · 布洛芬缓释胶囊", detail: "止痛退烧 · 0.3g/粒 · 口服，按说明或医嘱使用。 / 发热或疼痛时查看说明并咨询医生或药师。", memberId: "member-cp" }],
      }),
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "布洛芬缓释胶囊怎么吃？" }),
      }),
    )

    const payload = (await response.json()) as {
      intent: string
      answer: string
      sources: Array<{ label: string; detail: string; memberId: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(payload.intent, "medicine_usage")
    assert.equal(payload.answer, "布洛芬缓释胶囊建议按说明或医嘱使用。")
    assert.equal(payload.sources[0]?.label, "用药说明 · 曹鹏 · 布洛芬缓释胶囊")
    assert.equal(payload.sources[0]?.memberId, "member-cp")
  })

  it("returns medicine interaction answers unchanged", async () => {
    const handler = createAssistantQueryHandler(
      async () => ({
        intent: "medicine_interaction",
        answer: "这两种药先核对说明书再一起用。",
        sources: [
          { label: "药品 · 布洛芬缓释胶囊", detail: "止痛退烧 · 胃部不适、重复退烧药叠加需谨慎。", memberId: "member-cp" },
          { label: "药品 · 感冒灵颗粒", detail: "感冒对症 · 与退烧止痛药同服前，需要先确认成分是否重复。", memberId: "member-mom" },
        ],
      }),
      async () => ({ userId: DEFAULT_DEVELOPMENT_USER.id }),
    )

    const response = await handler(
      new Request("http://localhost/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "布洛芬和感冒灵能不能一起吃？" }),
      }),
    )

    const payload = (await response.json()) as {
      intent: string
      answer: string
      sources: Array<{ label: string; detail: string; memberId: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(payload.intent, "medicine_interaction")
    assert.equal(payload.answer, "这两种药先核对说明书再一起用。")
    assert.equal(payload.sources[0]?.label, "药品 · 布洛芬缓释胶囊")
    assert.equal(payload.sources[1]?.label, "药品 · 感冒灵颗粒")
  })
})
