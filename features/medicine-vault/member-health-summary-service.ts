import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import type { AssistantSource } from "./assistant-service"
import type { RepositoryContext } from "./auth-context"
import type { AllergyRecord, MedicalRecord, Medicine, Member } from "./data"
import type { MemberHealthSummary } from "./member-health-summary-shared"
import {
  getMemberById,
  listAllergyRecords,
  listMedicalRecords,
  listMedicines,
} from "./repository"
import { memberHealthSummarySchema, type MemberHealthSummaryGenerated } from "./schemas"

export type { MemberHealthSummary } from "./member-health-summary-shared"
export { formatMemberHealthSummaryForCopy } from "./member-health-summary-shared"

type MemberHealthSummaryDependencies = Readonly<{
  getMemberById: (ctx: RepositoryContext, memberId: string) => Promise<Member | undefined>
  listMedicalRecords: (ctx: RepositoryContext, memberId?: string) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext, memberId?: string) => Promise<Medicine[]>
  listAllergyRecords: (ctx: RepositoryContext, memberId?: string) => Promise<AllergyRecord[]>
  generateSummary: (input: {
    member: Member
    records: MedicalRecord[]
    medicines: Medicine[]
    allergies: AllergyRecord[]
  }) => Promise<MemberHealthSummaryGenerated>
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
  records: MedicalRecord[],
  medicines: Medicine[],
  allergies: AllergyRecord[],
) {
  return JSON.stringify(
    {
      member: {
        name: member.name,
        relationship: member.relationship,
        birthYear: member.birthYear,
        gender: member.gender,
        allergySummary: member.allergySummary,
        note: member.note,
      },
      records: records.map((record) => ({
        visitedAt: record.visitedAt,
        hospitalName: record.hospitalName,
        department: record.department,
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

function buildSources(
  records: MedicalRecord[],
  medicines: Medicine[],
  allergies: AllergyRecord[],
): AssistantSource[] {
  const sources: AssistantSource[] = []

  for (const record of records.slice(0, 5)) {
    sources.push({
      label: `病历 · ${record.diagnosis}`,
      detail: `${record.visitedAt} ${record.hospitalName}`,
    })
  }

  for (const medicine of medicines.slice(0, 5)) {
    sources.push({
      label: `药品 · ${medicine.name}`,
      detail: medicine.purpose || medicine.instructions,
    })
  }

  for (const allergy of allergies) {
    sources.push({
      label: `过敏 · ${allergy.allergen}`,
      detail: `${allergy.severity}：${allergy.reaction}`,
    })
  }

  return sources
}

function fallbackMemberHealthSummary(input: {
  member: Member
  records: MedicalRecord[]
  medicines: Medicine[]
  allergies: AllergyRecord[]
}): MemberHealthSummaryGenerated {
  const sortedRecords = [...input.records].sort((left, right) =>
    right.visitedAt.localeCompare(left.visitedAt),
  )
  const recentRecord = sortedRecords[0]
  const chronicTimeline =
    sortedRecords.length > 0
      ? sortedRecords.slice(0, 5).map(
          (record) => `${record.visitedAt}：${record.diagnosis}（${record.symptoms}）`,
        )
      : input.member.note.trim()
        ? [`健康备注：${input.member.note}`]
        : ["暂无明确病历时间线，建议补充就诊记录。"]

  const medicationSummary =
    input.medicines.length > 0
      ? `当前资料中有 ${input.medicines.length} 条药品记录，近期包括：${input.medicines
          .slice(0, 5)
          .map((medicine) => `${medicine.name}（${medicine.purpose || "用途待补充"}）`)
          .join("、")}。`
      : "暂无在册药品记录。"

  const allergyRisks =
    input.allergies.length > 0
      ? input.allergies
          .map((allergy) => `${allergy.allergen}（${allergy.severity}）：${allergy.reaction}`)
          .join("；")
      : input.member.allergySummary.trim() || "暂无明确过敏记录，建议就医时主动说明。"

  const lastVisitHighlight = recentRecord
    ? `${recentRecord.visitedAt} 于 ${recentRecord.hospitalName} ${recentRecord.department} 就诊，诊断 ${recentRecord.diagnosis}。主要症状：${recentRecord.symptoms}。医嘱摘要：${recentRecord.doctorAdvice}`
    : "暂无最近就医记录。"

  const doctorBrief = [
    `${input.member.name}（${input.member.relationship}，${input.member.birthYear} 年出生）。`,
    allergyRisks !== "暂无明确过敏记录，建议就医时主动说明。"
      ? `过敏/不适：${allergyRisks}。`
      : null,
    recentRecord ? `最近就诊：${recentRecord.diagnosis}（${recentRecord.visitedAt}）。` : null,
    input.medicines.length > 0
      ? `近期用药：${input.medicines
          .slice(0, 3)
          .map((medicine) => medicine.name)
          .join("、")}。`
      : null,
    "以上为家庭资料整理，不构成诊断或用药建议，请以医生当面评估为准。",
  ]
    .filter(Boolean)
    .join(" ")

  return memberHealthSummarySchema.parse({
    chronicTimeline,
    medicationSummary,
    allergyRisks,
    lastVisitHighlight,
    doctorBrief,
  })
}

async function defaultGenerateSummary(input: {
  member: Member
  records: MedicalRecord[]
  medicines: Medicine[]
  allergies: AllergyRecord[]
}) {
  if (!process.env.DASHSCOPE_API_KEY?.trim()) {
    return fallbackMemberHealthSummary(input)
  }

  try {
    const rawText = await createDashscopeChatCompletion({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: [
            "你是家庭健康资料整理助手，只能基于给定资料生成成员健康档案摘要，不能诊断、不能建议停药或加量。",
            "只允许返回 JSON，字段必须是 chronicTimeline, medicationSummary, allergyRisks, lastVisitHighlight, doctorBrief。",
            "chronicTimeline 是按时间整理的病史/就诊要点数组（最多 8 条，由近到远）。",
            "medicationSummary 汇总常用药与用途。",
            "allergyRisks 汇总过敏与风险提示。",
            "lastVisitHighlight 描述最近一次就医要点。",
            "doctorBrief 是 30 秒内可读完、适合给新医生看的摘要。",
            "不要编造资料中没有的信息。",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `请整理以下成员健康档案摘要：\n${buildMemberContext(
              input.member,
              input.records,
              input.medicines,
              input.allergies,
            )}`,
            '返回示例：{"chronicTimeline":["..."],"medicationSummary":"...","allergyRisks":"...","lastVisitHighlight":"...","doctorBrief":"..."}',
          ].join("\n\n"),
        },
      ],
    })

    const parsed = JSON.parse(extractJsonBlock(rawText)) as Partial<MemberHealthSummaryGenerated>
    return memberHealthSummarySchema.parse(parsed)
  } catch {
    return fallbackMemberHealthSummary(input)
  }
}

const defaultDependencies: MemberHealthSummaryDependencies = {
  getMemberById,
  listMedicalRecords,
  listMedicines,
  listAllergyRecords,
  generateSummary: defaultGenerateSummary,
}

export async function generateMemberHealthSummary(
  ctx: RepositoryContext,
  memberId: string,
  dependencies: Partial<MemberHealthSummaryDependencies> = {},
): Promise<MemberHealthSummary> {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  const member = await runtime.getMemberById(ctx, memberId)

  if (!member) {
    throw new Error("成员不存在或不属于当前用户。")
  }

  const [records, medicines, allergies] = await Promise.all([
    runtime.listMedicalRecords(ctx, memberId),
    runtime.listMedicines(ctx, memberId),
    runtime.listAllergyRecords(ctx, memberId),
  ])

  const summary = await runtime.generateSummary({
    member,
    records,
    medicines,
    allergies,
  })

  return {
    ...summary,
    sources: buildSources(records, medicines, allergies),
  }
}
