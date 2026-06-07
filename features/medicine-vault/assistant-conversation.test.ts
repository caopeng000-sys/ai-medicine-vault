import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { aiConversations } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { createAiConversation, listAiConversations } from "./repository"

describe("assistant conversation repository", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  it("stores and lists recent conversations for the current user", async () => {
    const initialLength = aiConversations.length

    await createAiConversation(ctx, {
      question: "我上次什么时候感冒？",
      answer: "你上次感冒相关的记录是 2026-04-12。",
      intent: "recent_cold_record",
      sources: [{ label: "病历 · 曹鹏", detail: "2026-04-12 · 上呼吸道感染" }],
    })

    const conversations = await listAiConversations(ctx, 10)

    assert.ok(conversations.length >= initialLength + 1)
    assert.equal(conversations[0]?.question, "我上次什么时候感冒？")
    assert.equal(conversations[0]?.intent, "recent_cold_record")
  })
})
