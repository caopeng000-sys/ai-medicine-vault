import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import type { AssistantSource } from "./assistant-service"
import { guardAiText } from "./ai-safety-guardrail"
import type { RepositoryContext } from "./auth-context"
import type { AllergyRecord, MedicalRecord, Medicine, Member } from "./data"
import { searchChunks } from "./health-chunk-index-service"
import type { HealthDataChunk } from "./health-data-chunk"
import { indexHealthData } from "./health-data-indexer"
import { retrieveRelevantChunks } from "./health-data-retrieval"
import {
  filterByMemberId,
  filterMembersById,
} from "./member-context-resolver"
import {
  listAllergyRecords,
  listMedicalRecordAttachments,
  listMedicalRecords,
  listMedicines,
  listMembers,
} from "./repository"

export type RagQueryResponse = Readonly<{
  answer: string
  sources: AssistantSource[]
}>

type RagQueryDependencies = Readonly<{
  listMembers: (ctx: RepositoryContext) => Promise<Member[]>
  listMedicalRecords: (ctx: RepositoryContext) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext) => Promise<Medicine[]>
  listAllergyRecords: (ctx: RepositoryContext) => Promise<AllergyRecord[]>
  listMedicalRecordAttachments: (ctx: RepositoryContext, memberId?: string) => Promise<
    Awaited<ReturnType<typeof listMedicalRecordAttachments>>
  >
  summarizeAnswer: (input: {
    question: string
    context: string
    sources: AssistantSource[]
  }) => Promise<string>
}>

function chunksToSources(chunks: HealthDataChunk[]): AssistantSource[] {
  return chunks.map((chunk) => ({
    label: chunk.title,
    detail: chunk.content.slice(0, 120),
  }))
}

function buildFallbackAnswer(question: string, sources: AssistantSource[]) {
  if (sources.length === 0) {
    return `没有找到与「${question}」相关的家庭健康资料。`
  }

  return [
    `根据现有资料，找到 ${sources.length} 条相关内容：`,
    ...sources.map((source, index) => `${index + 1}. ${source.label}：${source.detail}`),
    "以上内容来自家庭资料整理，不构成医疗建议。",
  ].join("\n")
}

async function defaultSummarizeAnswer(input: {
  question: string
  context: string
  sources: AssistantSource[]
}) {
  if (!process.env.DASHSCOPE_API_KEY?.trim() || input.sources.length === 0) {
    return buildFallbackAnswer(input.question, input.sources)
  }

  try {
    const rawText = await createDashscopeChatCompletion({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: [
            "你是家庭健康资料 RAG 助手，只能基于检索到的资料片段回答，不能诊断。",
            "回答要简洁，并说明依据来自哪些资料。",
            "如果资料不足以回答，直接说明未找到相关信息。",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `用户问题：${input.question}`,
            `检索资料：\n${input.context}`,
            "请用自然中文回答。",
          ].join("\n\n"),
        },
      ],
    })

    return rawText.trim()
  } catch {
    return buildFallbackAnswer(input.question, input.sources)
  }
}

const defaultDependencies: RagQueryDependencies = {
  listMembers,
  listMedicalRecords,
  listMedicines,
  listAllergyRecords,
  listMedicalRecordAttachments,
  summarizeAnswer: defaultSummarizeAnswer,
}

export type RagQueryOptions = Readonly<{ memberId?: string }>

export async function answerRagQuery(
  ctx: RepositoryContext,
  question: string,
  dependencies: Partial<RagQueryDependencies> = {},
  options: RagQueryOptions = {},
): Promise<RagQueryResponse> {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  const normalizedQuestion = question.trim()
  const memberId = options.memberId

  const [members, records, medicines, allergies, attachments] = await Promise.all([
    runtime.listMembers(ctx),
    runtime.listMedicalRecords(ctx),
    runtime.listMedicines(ctx),
    runtime.listAllergyRecords(ctx),
    runtime.listMedicalRecordAttachments(ctx, memberId),
  ])

  const chunks = indexHealthData({
    members: filterMembersById(members, memberId),
    records: filterByMemberId(records, memberId),
    medicines: filterByMemberId(medicines, memberId),
    allergies: filterByMemberId(allergies, memberId),
    attachments: filterByMemberId(attachments, memberId),
  })

  const indexedChunks = await searchChunks(ctx, normalizedQuestion, 5, memberId)
  const relevantChunks =
    indexedChunks.length > 0 ? indexedChunks : retrieveRelevantChunks(normalizedQuestion, chunks)
  const sources = chunksToSources(relevantChunks)
  const context = relevantChunks
    .map((chunk) => `[${chunk.title}] ${chunk.content}`)
    .join("\n\n")

  const answer = guardAiText(
    await runtime.summarizeAnswer({
      question: normalizedQuestion,
      context,
      sources,
    }),
  )

  return {
    answer: answer || buildFallbackAnswer(normalizedQuestion, sources),
    sources,
  }
}
