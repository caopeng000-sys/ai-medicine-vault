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
    assert.equal(result.sources[0]?.memberId, "member-cp")
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
    assert.equal(
      result.message,
      "这类问题我现在还不支持。你可以问我上次什么时候感冒、最近吃过哪些药、之前咳嗽看过几次、这个药和过敏史有没有冲突、我之前对哪些药有过不适、布洛芬怎么吃、家里有哪些抗过敏药、两种药能不能一起吃、过期药怎么处理，或者下次看医生前要准备什么。",
    )
    assert.equal(askedMembers, false)
    assert.equal(askedRecords, false)
    assert.equal(askedMedicines, false)
  })

  it("routes allergy history questions to the allergy flow", async () => {
    const result = await resolveAssistantQuery(ctx, "我之前对哪些药有过不适？", {
      classifyQuestion: async () => ({
        intent: "allergy_history",
        reason: "过敏史问题应进入过敏记录查询",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [
        {
          id: "allergy-penicillin",
          userId: ctx.userId,
          memberId: "member-cp",
          allergen: "青霉素",
          reaction: "既往使用后出现皮疹",
          severity: "中等",
          discoveredAt: "2012-08-10",
          note: "就医前需要主动告知医生。",
        },
      ],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "allergy_history")
    assert.equal(result.answer, "allergy_history:过敏记录 · 曹鹏 · 青霉素")
    assert.equal(result.sources[0]?.label, "过敏记录 · 曹鹏 · 青霉素")
    assert.equal(result.sources[0]?.memberId, "member-cp")
  })

  it("routes medicine usage questions to the usage flow", async () => {
    const result = await resolveAssistantQuery(ctx, "布洛芬缓释胶囊怎么吃？", {
      classifyQuestion: async () => ({
        intent: "medicine_usage",
        reason: "用药说明问题应进入用药说明查询",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "medicine_usage")
    assert.equal(result.answer, "medicine_usage:用药说明 · 曹鹏 · 布洛芬缓释胶囊")
    assert.equal(result.sources[0]?.label, "用药说明 · 曹鹏 · 布洛芬缓释胶囊")
    assert.equal(result.sources[0]?.memberId, "member-cp")
  })

  it("routes medicine interaction questions to the interaction flow", async () => {
    const result = await resolveAssistantQuery(ctx, "布洛芬和感冒灵能不能一起吃？", {
      classifyQuestion: async () => ({
        intent: "medicine_interaction",
        reason: "相互作用问题应进入用药联用查询",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "medicine_interaction")
    assert.equal(result.answer, "medicine_interaction:药品 · 布洛芬缓释胶囊|药品 · 感冒灵颗粒")
    assert.equal(result.sources[0]?.label, "药品 · 布洛芬缓释胶囊")
    assert.equal(result.sources[1]?.label, "药品 · 感冒灵颗粒")
  })

  it("routes medicine disposal questions to the disposal flow", async () => {
    const result = await resolveAssistantQuery(ctx, "过期药怎么办？", {
      classifyQuestion: async () => ({
        intent: "medicine_disposal",
        reason: "过期药问题应进入处理查询",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => [
        {
          ...medicines[4],
          id: "medicine-expired-vitamin-c",
          name: "维生素 C 片",
          expiresAt: "2025-12-10",
        },
        {
          ...medicines[1],
          id: "medicine-fresh-loratadine",
          name: "氯雷他定片",
          expiresAt: "2027-02-28",
        },
      ],
    })

    assert.equal(result.intent, "medicine_disposal")
    assert.equal(result.answer, "medicine_disposal:过期药处理 · 曹鹏 · 维生素 C 片")
    assert.equal(result.sources[0]?.label, "过期药处理 · 曹鹏 · 维生素 C 片")
    assert.equal(result.sources[0]?.memberId, "member-cp")
  })

  it("routes recent medicine history questions to medical record backed sources", async () => {
    const result = await resolveAssistantQuery(ctx, "我最近吃过哪些药？", {
      classifyQuestion: async () => ({
        intent: "recent_medicine_history",
        reason: "近期用药问题",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "recent_medicine_history")
    assert.ok(result.answer.includes("recent_medicine_history:"))
    assert.ok(result.sources.some((source) => source.label.includes("用药线索")))
  })

  it("routes symptom history questions to matching records", async () => {
    const result = await resolveAssistantQuery(ctx, "我之前咳嗽看过几次？", {
      classifyQuestion: async () => ({
        intent: "symptom_history",
        reason: "症状历史问题",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "symptom_history")
    assert.ok(result.sources.some((source) => source.label.includes("症状病历")))
    assert.ok(result.sources[0]?.detail.includes("咳嗽"))
  })

  it("routes medicine allergy conflict questions to allergy review sources", async () => {
    const result = await resolveAssistantQuery(ctx, "布洛芬和我的过敏史有没有冲突？", {
      classifyQuestion: async () => ({
        intent: "medicine_allergy_conflict",
        reason: "过敏核对问题",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources.map((source) => source.label).join("|")}`,
      listMembers: async () => members,
      listAllergyRecords: async () => [
        {
          id: "allergy-ibuprofen",
          userId: ctx.userId,
          memberId: "member-cp",
          allergen: "布洛芬",
          reaction: "服用后胃部不适",
          severity: "中等",
          discoveredAt: "2026-01-01",
          note: "用药前需要咨询医生。",
        },
      ],
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
    })

    assert.equal(result.intent, "medicine_allergy_conflict")
    assert.equal(result.sources[0]?.label, "过敏核对 · 曹鹏 · 布洛芬缓释胶囊")
    assert.ok(result.sources[0]?.detail.includes("布洛芬"))
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
    assert.equal(result.sources[0]?.memberId, "member-child")
  })

  it("routes visit preparation questions to the preparation flow", async () => {
    const result = await resolveAssistantQuery(ctx, "下次看医生前要准备什么？", {
      classifyQuestion: async () => ({
        intent: "visit_preparation",
        reason: "就医准备问题",
      }),
      selectMedicines: async () => ({ selectedIds: [], summary: "", reason: "" }),
      summarizeAnswer: async ({ intent, sources }) => `${intent}:${sources[0]?.label ?? "none"}`,
      listMembers: async () => members,
      listMedicalRecords: async () => medicalRecords,
      listMedicines: async () => medicines,
      listVisitPreparations: async () => [
        {
          userId: ctx.userId,
          memberId: "member-cp",
          concern: "咳嗽低烧复诊前准备",
          summary: "需要说明咳嗽持续时间、已使用药品和青霉素疑似过敏史。",
          questions: ["当前咳嗽是否需要进一步检查？"],
        },
      ],
    })

    assert.equal(result.intent, "visit_preparation")
    assert.equal(result.answer, "visit_preparation:就医准备 · 曹鹏")
    assert.equal(result.sources[0]?.label, "就医准备 · 曹鹏")
    assert.equal(result.sources[0]?.memberId, "member-cp")
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
