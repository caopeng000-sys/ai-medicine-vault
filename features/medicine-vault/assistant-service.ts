import type { AllergyRecord, MedicalRecord, Medicine, Member, VisitPreparation } from "./data"
import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import type { RepositoryContext } from "./auth-context"
import { listAllergyRecords, listMedicalRecords, listMedicines, listMembers, listVisitPreparations } from "./repository"
import {
  detectAssistantIntent,
  findAllergyHistory,
  findRecentColdRecord,
  findMedicineDisposalGuidance,
  findMedicineInteractionGuidance,
  findMedicineUsageGuidance,
  findVisitPreparation,
  parseAssistantIntent,
  type AssistantIntent,
} from "./assistant-routing"

export type AssistantSource = Readonly<{
  label: string
  detail: string
  memberId?: string
}>

export type AssistantQueryResponse = Readonly<{
  intent: AssistantIntent
  answer: string
  message?: string
  sources: AssistantSource[]
}>

type AssistantClassification = Readonly<{
  intent: AssistantIntent
  reason: string
}>

type AssistantMedicineSelection = Readonly<{
  selectedIds: string[]
  summary: string
  reason: string
}>

type AssistantDependencies = Readonly<{
  classifyQuestion: (question: string) => Promise<AssistantClassification>
  selectMedicines: (
    question: string,
    medicines: Medicine[],
    members: Member[],
  ) => Promise<AssistantMedicineSelection>
  summarizeAnswer: (input: {
    question: string
    intent: AssistantIntent
    sources: AssistantSource[]
    context: string
  }) => Promise<string>
  listMembers: (ctx: RepositoryContext) => Promise<Member[]>
  listAllergyRecords: (ctx: RepositoryContext) => Promise<AllergyRecord[]>
  listMedicalRecords: (ctx: RepositoryContext) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext) => Promise<Medicine[]>
  listVisitPreparations: (ctx: RepositoryContext) => Promise<VisitPreparation[]>
}>

const UNSUPPORTED_MESSAGE =
  "这类问题我现在还不支持。你可以问我上次什么时候感冒、我之前对哪些药有过不适、布洛芬怎么吃、家里有哪些抗过敏药、两种药能不能一起吃、过期药怎么处理，或者下次看医生前要准备什么。"
const NO_RESULT_MESSAGE = "我找到了这个问题对应的方向，但暂时没有查到可用记录。"

function buildSourceDetail(title: string, detail: string) {
  return `${title} · ${detail}`
}

function buildMedicineCatalog(medicines: Medicine[], members: Member[]) {
  return medicines
    .map((medicine) => {
      const memberName = members.find((item) => item.id === medicine.memberId)?.name ?? "未知成员"
      return [
        `id: ${medicine.id}`,
        `name: ${medicine.name}`,
        `category: ${medicine.category}`,
        `purpose: ${medicine.purpose}`,
        `instructions: ${medicine.instructions}`,
        `usageNote: ${medicine.usageNote}`,
        `member: ${memberName}`,
      ].join("\n")
    })
    .join("\n\n---\n\n")
}

function buildContext(intent: AssistantIntent, sources: AssistantSource[]) {
  return JSON.stringify(
    {
      intent,
      sources,
    },
    null,
    2,
  )
}

function fallbackAnswer(intent: AssistantIntent, sources: AssistantSource[]) {
  if (intent === "recent_cold_record") {
    const source = sources[0]
    if (!source) return NO_RESULT_MESSAGE
    return `你上次感冒相关的记录是：${source.detail}。`
  }

  if (intent === "allergy_history") {
    if (sources.length === 0) return NO_RESULT_MESSAGE
    return `我查到这些过敏或不良反应记录：${sources.map((item) => item.label).join("、")}。`
  }

  if (intent === "medicine_usage") {
    if (sources.length === 0) return NO_RESULT_MESSAGE
    return `我整理到这些用药说明：${sources.map((item) => item.label).join("、")}。`
  }

  if (intent === "medicine_interaction") {
    if (sources.length === 0) return NO_RESULT_MESSAGE
    return `我查到你提到的相关药品记录：${sources.map((item) => item.label).join("、")}。一起吃前先核对说明书，或问药师确认是否有重复成分、相互作用或用法冲突。`
  }

  if (intent === "medicine_disposal") {
    if (sources.length === 0) return NO_RESULT_MESSAGE
    return `我查到这些需要处理的药品：${sources.map((item) => item.label).join("、")}。过期药不要继续服用，建议按说明书或当地药品回收要求处理。`
  }

  if (intent === "medicine_query") {
    if (sources.length === 0) return NO_RESULT_MESSAGE
    return `家里现有的相关药品包括：${sources.map((item) => item.label).join("、")}。`
  }

  if (intent === "visit_preparation") {
    if (sources.length === 0) return NO_RESULT_MESSAGE
    return `这份就医准备清单可以先参考：${sources[0]?.detail ?? "暂无摘要"}.`
  }

  return NO_RESULT_MESSAGE
}

function fallbackSelectMedicines(question: string, medicines: Medicine[]) {
  const normalizedQuestion = question.toLowerCase()
  const hasCoughIntent = normalizedQuestion.includes("咳嗽") || normalizedQuestion.includes("止咳") || normalizedQuestion.includes("咳")
  const hasAllergyIntent =
    normalizedQuestion.includes("过敏") ||
    normalizedQuestion.includes("鼻炎") ||
    normalizedQuestion.includes("荨麻疹") ||
    normalizedQuestion.includes("打喷嚏")
  const hasColdIntent =
    normalizedQuestion.includes("感冒") ||
    normalizedQuestion.includes("发烧") ||
    normalizedQuestion.includes("发热") ||
    normalizedQuestion.includes("退烧")
  const hasPainIntent = normalizedQuestion.includes("止痛") || normalizedQuestion.includes("疼痛")

  const selectedIds = medicines
    .filter((medicine) => {
      const text = [
        medicine.name,
        medicine.category,
        medicine.purpose,
        medicine.instructions,
        medicine.usageNote,
        medicine.safetyNote,
      ]
        .join(" ")
        .toLowerCase()

      if (hasAllergyIntent && (text.includes("过敏") || text.includes("鼻炎") || text.includes("荨麻疹"))) {
        return true
      }

      if (hasCoughIntent && (text.includes("咽喉") || text.includes("咳") || text.includes("呼吸道"))) {
        return true
      }

      if (hasColdIntent && (text.includes("感冒") || text.includes("退烧") || text.includes("发热"))) {
        return true
      }

      if (hasPainIntent && (text.includes("疼痛") || text.includes("止痛"))) {
        return true
      }

      return false
    })
    .map((medicine) => medicine.id)

  return {
    selectedIds,
    summary: selectedIds.length ? `我找到了 ${selectedIds.length} 条相关药品记录。` : NO_RESULT_MESSAGE,
    reason: "模型选择失败，已使用本地兜底规则。",
  }
}

async function defaultClassifyQuestion(question: string): Promise<AssistantClassification> {
  const fallbackIntent = detectAssistantIntent(question)

  try {
    const rawText = await createDashscopeChatCompletion({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: [
            "你是一个家庭健康资料助手的意图识别器。",
            "只允许返回 JSON。",
            '可选 intent 只有八个：recent_cold_record, allergy_history, medicine_usage, medicine_interaction, medicine_disposal, medicine_query, visit_preparation, unsupported。',
            '如果问题在问“上次什么时候感冒 / 上次感冒 / 最近感冒记录”，返回 recent_cold_record。',
            '如果问题在问“我之前对哪些药有过不适 / 药物过敏史 / 过敏反应 / 不良反应”，返回 allergy_history。',
            '如果问题在问“能不能一起吃 / 相互作用 / 同服 / 联用 / 重复成分 / 不能同服”，返回 medicine_interaction。',
            '如果问题在问“过期药怎么办 / 过期药还能不能吃 / 怎么处理过期药 / 家里有哪些过期药”，返回 medicine_disposal。',
            '如果问题在问“布洛芬怎么吃 / 服用方法 / 饭前饭后 / 注意事项 / 用法用量”，返回 medicine_usage。',
            '如果问题在问任何家庭药品相关问题，例如“家里有哪些抗咳嗽药 / 抗过敏药 / 退烧药 / 感冒药 / 止痛药”，返回 medicine_query。',
            '如果问题在问“下次看医生要准备什么 / 复诊要带什么 / 就医前准备什么”，返回 visit_preparation。',
            "其他问题返回 unsupported。",
            '返回格式示例：{"intent":"recent_cold_record","reason":"命中了感冒记录意图"}',
          ].join("\n"),
        },
        {
          role: "user",
          content: question,
        },
      ],
    })

    const parsed = parseAssistantIntent(rawText)

    return {
      intent: parsed.intent === "unsupported" ? fallbackIntent : parsed.intent,
      reason: parsed.reason,
    }
  } catch {
    return {
      intent: fallbackIntent,
      reason: "模型识别失败，已使用本地兜底规则。",
    }
  }
}

async function defaultSelectMedicines(
  question: string,
  medicines: Medicine[],
  members: Member[],
): Promise<AssistantMedicineSelection> {
  try {
    const rawText = await createDashscopeChatCompletion({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: [
            "你是家庭药品资料助手的候选药品选择器。",
            "请从候选药品中选择和用户问题最相关的药品，只允许返回 JSON。",
            "返回字段必须是 selectedIds, summary, reason。",
            "selectedIds 是数组，里面只能放候选药品 id。",
            "summary 用中文简短概括，不要诊断。",
            "如果没有合适候选，selectedIds 为空数组，summary 说明未找到。",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `用户问题：${question}`,
            `候选药品：\n${buildMedicineCatalog(medicines, members)}`,
            '请返回格式示例：{"selectedIds":["medicine-1"],"summary":"家里有两种相关药品。","reason":"命中了咳嗽相关候选"}',
          ].join("\n\n"),
        },
      ],
    })

    const parsed = JSON.parse(rawText) as Partial<AssistantMedicineSelection>
    const selectedIds = Array.isArray(parsed.selectedIds)
      ? parsed.selectedIds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : []

    return {
      selectedIds,
      summary: typeof parsed.summary === "string" && parsed.summary.trim() ? parsed.summary.trim() : NO_RESULT_MESSAGE,
      reason: typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : "未返回原因",
    }
  } catch {
    return fallbackSelectMedicines(question, medicines)
  }
}

async function defaultSummarizeAnswer(input: {
  question: string
  intent: AssistantIntent
  sources: AssistantSource[]
  context: string
}) {
  const rawText = await createDashscopeChatCompletion({
    model: "qwen-plus",
    messages: [
      {
        role: "system",
        content: [
          "你是家庭健康资料助手，只能基于给定资料整理答案，不能诊断。",
          "回答要简洁、友好、带来源依据。",
          "如果资料不足，直接说明没有查到。",
          "必须保留来源信息，不要编造。",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `问题：${input.question}`,
          `意图：${input.intent}`,
          `资料：${input.context}`,
          "请用自然中文回答，并在末尾保留来源依据。",
        ].join("\n\n"),
      },
    ],
  })

  return rawText.trim()
}

const defaultDependencies: AssistantDependencies = {
  classifyQuestion: defaultClassifyQuestion,
  selectMedicines: defaultSelectMedicines,
  summarizeAnswer: defaultSummarizeAnswer,
  listMembers,
  listAllergyRecords,
  listMedicalRecords,
  listMedicines,
  listVisitPreparations,
}

export async function resolveAssistantQuery(
  ctx: RepositoryContext,
  question: string,
  dependencies: Partial<AssistantDependencies> = {},
): Promise<AssistantQueryResponse> {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  const normalizedQuestion = question.trim()
  if (!normalizedQuestion) {
    return {
      intent: "unsupported",
      answer: "",
      message: UNSUPPORTED_MESSAGE,
      sources: [],
    }
  }

  const classification = await runtime.classifyQuestion(normalizedQuestion)

  if (classification.intent === "unsupported") {
    return {
      intent: "unsupported",
      answer: "",
      message: UNSUPPORTED_MESSAGE,
      sources: [],
    }
  }

  if (classification.intent === "recent_cold_record") {
    const [members, records] = await Promise.all([runtime.listMembers(ctx), runtime.listMedicalRecords(ctx)])
    const match = findRecentColdRecord(records, members)

    if (!match) {
      return {
        intent: classification.intent,
        answer: NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = [
      {
        label: `病历 · ${match.member?.name ?? "未知成员"}`,
        detail: buildSourceDetail(
          match.record.visitedAt,
          [
            match.record.diagnosis,
            match.record.symptoms,
            match.record.clinicalSummary || "暂无诊疗摘要",
            match.record.followUpAt ? `复诊时间 ${match.record.followUpAt}` : "暂无复诊时间",
          ].join(" / "),
        ),
        memberId: match.record.memberId,
      },
    ]

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  if (classification.intent === "allergy_history") {
    const [members, allergyRecords] = await Promise.all([runtime.listMembers(ctx), runtime.listAllergyRecords(ctx)])
    const matches = findAllergyHistory(allergyRecords, members, normalizedQuestion)

    if (!matches.length) {
      return {
        intent: classification.intent,
        answer: NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = matches.map((match) => ({
      label: `过敏记录 · ${match.member?.name ?? "未知成员"} · ${match.record.allergen}`,
      detail: buildSourceDetail(match.record.severity, `${match.record.reaction} / ${match.record.note}`),
      memberId: match.record.memberId,
    }))

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  if (classification.intent === "medicine_usage") {
    const [members, medicines] = await Promise.all([runtime.listMembers(ctx), runtime.listMedicines(ctx)])
    const matches = findMedicineUsageGuidance(medicines, members, normalizedQuestion)

    if (!matches.length) {
      return {
        intent: classification.intent,
        answer: NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = matches.map((match) => ({
      label: `用药说明 · ${match.member?.name ?? "未知成员"} · ${match.medicine.name}`,
      detail: buildSourceDetail(
        match.medicine.category,
        `${match.medicine.dosage} · ${match.medicine.instructions} · ${match.medicine.usageNote} · ${match.medicine.safetyNote}`,
      ),
      memberId: match.medicine.memberId,
    }))

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  if (classification.intent === "medicine_interaction") {
    const [members, medicines] = await Promise.all([runtime.listMembers(ctx), runtime.listMedicines(ctx)])
    const matches = findMedicineInteractionGuidance(medicines, members, normalizedQuestion)

    if (!matches.length) {
      return {
        intent: classification.intent,
        answer: NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = matches.map((match) => ({
      label: `药品 · ${match.medicine.name}`,
      detail: [
        match.medicine.category,
        `${match.member?.name ?? "未知成员"} · ${match.medicine.purpose}`,
        `${match.medicine.instructions} / ${match.medicine.usageNote} / ${match.medicine.safetyNote}`,
      ].join(" · "),
      memberId: match.medicine.memberId,
    }))

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  if (classification.intent === "medicine_disposal") {
    const [members, medicines] = await Promise.all([runtime.listMembers(ctx), runtime.listMedicines(ctx)])
    const matches = findMedicineDisposalGuidance(medicines, members, normalizedQuestion)

    if (!matches.length) {
      return {
        intent: classification.intent,
        answer: NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = matches.map((match) => {
      const statusText = match.medicine.expiresAt
        ? `${match.medicine.expiresAt}${match.medicine.quantity ? ` · ${match.medicine.quantity}` : ""}`
        : "暂无过期信息"
      const daysLeft = new Date(`${match.medicine.expiresAt}T00:00:00+08:00`)
      const today = new Date("2026-04-25T00:00:00+08:00")
      const deltaDays = Math.ceil((daysLeft.getTime() - today.getTime()) / 86_400_000)
      const reminder = deltaDays < 0 ? `已过期 ${Math.abs(deltaDays)} 天` : `距离过期 ${deltaDays} 天`

      return {
        label: `过期药处理 · ${match.member?.name ?? "未知成员"} · ${match.medicine.name}`,
        detail: buildSourceDetail(
          `${match.medicine.category} / ${reminder}`,
          `${match.medicine.storageLocation} · ${match.medicine.usageNote} · ${match.medicine.safetyNote} · ${statusText}`,
        ),
        memberId: match.medicine.memberId,
      }
    })

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  if (classification.intent === "medicine_query") {
    const [members, medicines] = await Promise.all([runtime.listMembers(ctx), runtime.listMedicines(ctx)])
    const selection = await runtime.selectMedicines(normalizedQuestion, medicines, members)
    const selectedIdSet = new Set(selection.selectedIds)
    const selectedMedicines = medicines.filter((medicine) => selectedIdSet.has(medicine.id))

    if (selectedMedicines.length === 0) {
      return {
        intent: classification.intent,
        answer: selection.summary || NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = selectedMedicines.map((medicine) => ({
      label: `药品 · ${medicine.name}`,
      detail: buildSourceDetail(
        medicine.category,
        `${members.find((item) => item.id === medicine.memberId)?.name ?? "未知成员"} · ${medicine.purpose} · ${medicine.instructions}`,
      ),
      memberId: medicine.memberId,
    }))

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || selection.summary || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: selection.summary || fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  if (classification.intent === "visit_preparation") {
    const [members, preparations] = await Promise.all([runtime.listMembers(ctx), runtime.listVisitPreparations(ctx)])
    const match = findVisitPreparation(preparations, members, normalizedQuestion)

    if (!match) {
      return {
        intent: classification.intent,
        answer: NO_RESULT_MESSAGE,
        sources: [],
      }
    }

    const sources: AssistantSource[] = [
      {
        label: `就医准备 · ${match.member?.name ?? "未知成员"}`,
        detail: buildSourceDetail(match.visitPreparation.concern, match.visitPreparation.summary),
        memberId: match.visitPreparation.memberId,
      },
    ]

    try {
      const answer = await runtime.summarizeAnswer({
        question: normalizedQuestion,
        intent: classification.intent,
        sources,
        context: buildContext(classification.intent, sources),
      })

      return {
        intent: classification.intent,
        answer: answer || fallbackAnswer(classification.intent, sources),
        sources,
      }
    } catch {
      return {
        intent: classification.intent,
        answer: fallbackAnswer(classification.intent, sources),
        sources,
      }
    }
  }

  return {
    intent: "unsupported",
    answer: "",
    message: UNSUPPORTED_MESSAGE,
    sources: [],
  }
}
