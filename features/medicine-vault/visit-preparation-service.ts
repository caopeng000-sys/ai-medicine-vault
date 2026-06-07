import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import { guardAiText, HIGH_RISK_QUESTION_TEMPLATE, isHighRiskQuestion } from "./ai-safety-guardrail"
import type { RepositoryContext } from "./auth-context"
import type { AllergyRecord, MedicalRecord, Medicine, Member, VisitPreparation } from "./data"
import {
  createVisitPreparation,
  getMemberById,
  listAllergyRecords,
  listMedicalRecords,
  listMedicines,
} from "./repository"
import type { GenerateVisitPreparationInput } from "./schemas"
import { visitPreparationGeneratedSchema } from "./schemas"

type VisitPreparationDependencies = Readonly<{
  getMemberById: (ctx: RepositoryContext, memberId: string) => Promise<Member | undefined>
  listMedicalRecords: (ctx: RepositoryContext, memberId?: string) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext, memberId?: string) => Promise<Medicine[]>
  listAllergyRecords: (ctx: RepositoryContext, memberId?: string) => Promise<AllergyRecord[]>
  createVisitPreparation: (
    ctx: RepositoryContext,
    input: Readonly<{
      memberId: string
      concern: string
      summary: string
      questions: string[]
    }>,
  ) => Promise<VisitPreparation>
  generateDraft: (input: {
    member: Member
    concern: string
    records: MedicalRecord[]
    medicines: Medicine[]
    allergies: AllergyRecord[]
  }) => Promise<Readonly<{ concern: string; summary: string; questions: string[] }>>
}>

function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const trimmed = text.trim()

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error("AI 没有返回可解析的结构化结果。")
  }

  return trimmed
}

function buildMemberContext(
  member: Member,
  concern: string,
  records: MedicalRecord[],
  medicines: Medicine[],
  allergies: AllergyRecord[],
) {
  return JSON.stringify(
    {
      member: {
        name: member.name,
        relationship: member.relationship,
        allergySummary: member.allergySummary,
        note: member.note,
      },
      concern,
      records: records.map((record) => ({
        visitedAt: record.visitedAt,
        diagnosis: record.diagnosis,
        symptoms: record.symptoms,
        doctorAdvice: record.doctorAdvice,
      })),
      medicines: medicines.map((medicine) => ({
        name: medicine.name,
        purpose: medicine.purpose,
        instructions: medicine.instructions,
        expiresAt: medicine.expiresAt,
      })),
      allergies: allergies.map((allergy) => ({
        allergen: allergy.allergen,
        severity: allergy.severity,
        reaction: allergy.reaction,
      })),
    },
    null,
    2,
  )
}

function fallbackVisitPreparationDraft(input: {
  member: Member
  concern: string
  records: MedicalRecord[]
  medicines: Medicine[]
  allergies: AllergyRecord[]
}) {
  const recentRecord = input.records[0]
  const summaryParts = [
    `成员：${input.member.name}（${input.member.relationship}）。`,
    `就医关注点：${input.concern}。`,
  ]

  if (recentRecord) {
    summaryParts.push(
      `近期相关记录：${recentRecord.visitedAt} ${recentRecord.diagnosis}，症状包括 ${recentRecord.symptoms}。`,
    )
  }

  if (input.medicines.length > 0) {
    summaryParts.push(
      `近期相关药品：${input.medicines
        .slice(0, 5)
        .map((medicine) => medicine.name)
        .join("、")}。`,
    )
  }

  if (input.allergies.length > 0) {
    summaryParts.push(
      `过敏提醒：${input.allergies.map((allergy) => `${allergy.allergen}（${allergy.severity}）`).join("、")}。`,
    )
  } else if (input.member.allergySummary.trim()) {
    summaryParts.push(`过敏摘要：${input.member.allergySummary}`)
  }

  summaryParts.push("建议携带近期病历、用药清单和过敏记录，就医时主动说明。")

  const questions = [
    "当前症状或关注问题是否需要进一步检查？",
    input.medicines.length > 0 ? "目前在用的药品是否需要调整或继续按说明使用？" : "是否需要补充或调整当前用药？",
    input.allergies.length > 0 ? "已有过敏/不适记录是否会影响本次用药或检查？" : "是否有需要补充说明的过敏或不适史？",
    "如果出现哪些情况需要尽快复诊？",
  ]

  return visitPreparationGeneratedSchema.parse({
    concern: input.concern,
    summary: summaryParts.join("\n"),
    questions,
  })
}

async function defaultGenerateDraft(input: {
  member: Member
  concern: string
  records: MedicalRecord[]
  medicines: Medicine[]
  allergies: AllergyRecord[]
}) {
  if (!process.env.DASHSCOPE_API_KEY?.trim()) {
    return fallbackVisitPreparationDraft(input)
  }

  try {
    const rawText = await createDashscopeChatCompletion({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: [
            "你是家庭健康资料助手，只能基于给定资料整理就医前准备清单，不能诊断。",
            "只允许返回 JSON，字段必须是 concern, summary, questions。",
            "summary 需包含：症状/既往记录摘要、相关用药、过敏提醒、建议携带资料。",
            "questions 是 5-8 条建议向医生或药师咨询的问题。",
            "不要编造资料中没有的信息。",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `请为以下成员整理就医前准备清单：\n${buildMemberContext(
              input.member,
              input.concern,
              input.records,
              input.medicines,
              input.allergies,
            )}`,
            '返回示例：{"concern":"咳嗽低烧复诊","summary":"...","questions":["...","..."]}',
          ].join("\n\n"),
        },
      ],
    })

    const parsed = JSON.parse(extractJsonBlock(rawText)) as Partial<{
      concern: string
      summary: string
      questions: string[]
    }>

    return visitPreparationGeneratedSchema.parse({
      concern: parsed.concern?.trim() || input.concern,
      summary: parsed.summary,
      questions: parsed.questions,
    })
  } catch {
    return fallbackVisitPreparationDraft(input)
  }
}

const defaultDependencies: VisitPreparationDependencies = {
  getMemberById,
  listMedicalRecords,
  listMedicines,
  listAllergyRecords,
  createVisitPreparation,
  generateDraft: defaultGenerateDraft,
}

export async function generateVisitPreparation(
  ctx: RepositoryContext,
  input: GenerateVisitPreparationInput,
  dependencies: Partial<VisitPreparationDependencies> = {},
): Promise<VisitPreparation> {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  const member = await runtime.getMemberById(ctx, input.memberId)

  if (!member) {
    throw new Error("成员不存在或不属于当前用户。")
  }

  if (isHighRiskQuestion(input.concern)) {
    return runtime.createVisitPreparation(ctx, {
      memberId: input.memberId,
      concern: input.concern,
      summary: HIGH_RISK_QUESTION_TEMPLATE,
      questions: [HIGH_RISK_QUESTION_TEMPLATE],
    })
  }

  const [records, medicines, allergies] = await Promise.all([
    runtime.listMedicalRecords(ctx, input.memberId),
    runtime.listMedicines(ctx, input.memberId),
    runtime.listAllergyRecords(ctx, input.memberId),
  ])

  const draft = await runtime.generateDraft({
    member,
    concern: input.concern,
    records,
    medicines,
    allergies,
  })

  return runtime.createVisitPreparation(ctx, {
    memberId: input.memberId,
    concern: draft.concern,
    summary: guardAiText(draft.summary),
    questions: draft.questions.map((question) => guardAiText(question)),
  })
}
