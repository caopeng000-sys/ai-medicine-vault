import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { medicalRecords, medicines, members } from "./data"
import { DEFAULT_DEVELOPMENT_USER, type RepositoryContext } from "./auth-context"
import { resolveAssistantQuery } from "./assistant-service"

describe("assistant service", () => {
  const ctx: RepositoryContext = { userId: DEFAULT_DEVELOPMENT_USER.id }

  it("returns a source-backed answer for a cold question", async () => {
    const result = await resolveAssistantQuery(ctx, "我上次什么时候感冒", {
      classifyQuestion: async () => ({
        intent: "recent_cold_record",
        reason: "命中感冒问题",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, question }) => `${intent}:${question}`,
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "recent_cold_record")
    assert.equal(result.answer, "recent_cold_record:我上次什么时候感冒")
    assert.ok(result.sources.some((source) => source.label.includes("病历")))
  })

  it("returns a friendly hint for unsupported questions", async () => {
    let askedMembers = false
    let askedRecords = false
    let askedMedicines = false

    const result = await resolveAssistantQuery(ctx, "我今天心情怎么样", {
      classifyQuestion: async () => ({
        intent: "unsupported",
        reason: "不属于已支持意图",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async () => "不会被调用",
      listMembers: async () => {
        askedMembers = true
        return members
      },
      listMedicalRecords: async () => {
        askedRecords = true
        return medicalRecords
      },
      listMedicines: async () => {
        askedMedicines = true
        return medicines
      },
    })

    assert.equal(result.intent, "unsupported")
    assert.equal(result.answer, "")
    assert.equal(result.message, "这类问题我现在还不支持。你可以问我上次什么时候感冒，或者家里有哪些抗过敏药。")
    assert.equal(askedMembers, false)
    assert.equal(askedRecords, false)
    assert.equal(askedMedicines, false)
  })

  it("routes cough medicine questions to the medicine query flow", async () => {
    const result = await resolveAssistantQuery(ctx, "家里有哪些抗咳嗽药？", {
      classifyQuestion: async () => ({
        intent: "medicine_query",
        reason: "药品类问题应进入药品查询",
      }),
      selectMedicines: async () => ({
        selectedIds: ["medicine-cough-syrup"],
        summary: "家里有双黄连口服液。",
        reason: "命中了咳嗽相关药品",
      }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.length}`,
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "medicine_query")
    assert.equal(result.answer, "medicine_query:1")
    assert.equal(result.sources[0]?.label, "药品 · 双黄连口服液")
  })

  it("passes repository context into default data dependencies", async () => {
    const seen: string[] = []

    const result = await resolveAssistantQuery(ctx, "家里有哪些抗过敏药？", {
      classifyQuestion: async () => ({
        intent: "medicine_query",
        reason: "药品类问题",
      }),
      selectMedicines: async (_question, availableMedicines) => ({
        selectedIds: [availableMedicines[0]?.id ?? ""].filter(Boolean),
        summary: "找到药品。",
        reason: "测试上下文传递",
      }),
      summarizeAnswer: async ({ sources }) => `sources:${sources.length}`,
      listMembers: async (receivedCtx) => {
        seen.push(receivedCtx.userId)
        return members
      },
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async (receivedCtx) => {
        seen.push(receivedCtx.userId)
        return medicines
      },
    })

    assert.equal(result.answer, "sources:1")
    assert.deepEqual(seen, [ctx.userId, ctx.userId])
  })
})
