import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import type { RepositoryContext } from "./auth-context"
import type { AllergyRecord, MedicalRecord, Medicine, Member } from "./data"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMedicines,
  listMembers,
} from "./repository"

export type SearchResultCategory = "member" | "record" | "medicine" | "allergy"

export type SearchResultItem = Readonly<{
  id: string
  category: SearchResultCategory
  label: string
  detail: string
  href: string
}>

export type VaultSearchResponse = Readonly<{
  query: string
  summary: string
  results: SearchResultItem[]
  counts: Readonly<{
    members: number
    records: number
    medicines: number
    allergies: number
  }>
}>

type VaultSearchDependencies = Readonly<{
  listMembers: (ctx: RepositoryContext) => Promise<Member[]>
  listMedicalRecords: (ctx: RepositoryContext) => Promise<MedicalRecord[]>
  listMedicines: (ctx: RepositoryContext) => Promise<Medicine[]>
  listAllergyRecords: (ctx: RepositoryContext) => Promise<AllergyRecord[]>
  summarizeResults: (input: { query: string; results: SearchResultItem[] }) => Promise<string>
}>

const RESULT_LIMIT = 5

function normalizeQuery(query: string) {
  return query.trim().toLowerCase()
}

function includesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query)
}

function joinFields(values: Array<string | number | undefined>) {
  return values.filter(Boolean).join(" ")
}

function buildFallbackSummary(query: string, results: SearchResultItem[]) {
  if (results.length === 0) {
    return `没有找到与「${query}」相关的家庭健康资料。`
  }

  const categoryLabels: Record<SearchResultCategory, string> = {
    member: "成员",
    record: "病历",
    medicine: "药品",
    allergy: "过敏",
  }

  const grouped = results.reduce<Record<SearchResultCategory, number>>(
    (counts, item) => {
      counts[item.category] += 1
      return counts
    },
    { member: 0, record: 0, medicine: 0, allergy: 0 },
  )

  const parts = (Object.entries(grouped) as Array<[SearchResultCategory, number]>)
    .filter(([, count]) => count > 0)
    .map(([category, count]) => `${count} 条${categoryLabels[category]}`)

  return `找到 ${results.length} 条与「${query}」相关的结果，包括 ${parts.join("、")}。`
}

async function defaultSummarizeResults(input: { query: string; results: SearchResultItem[] }) {
  if (!process.env.DASHSCOPE_API_KEY?.trim() || input.results.length === 0) {
    return buildFallbackSummary(input.query, input.results)
  }

  try {
    const rawText = await createDashscopeChatCompletion({
      model: "qwen-plus",
      messages: [
        {
          role: "system",
          content: [
            "你是家庭健康资料搜索助手，只能基于给定搜索结果写一句简短中文摘要。",
            "不要诊断，不要补充搜索结果中没有的信息。",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `搜索词：${input.query}`,
            `结果：${JSON.stringify(input.results.slice(0, 8), null, 2)}`,
            "请用 1-2 句话总结找到了什么。",
          ].join("\n\n"),
        },
      ],
    })

    return rawText.trim() || buildFallbackSummary(input.query, input.results)
  } catch {
    return buildFallbackSummary(input.query, input.results)
  }
}

function searchMembers(members: Member[], query: string): SearchResultItem[] {
  return members
    .filter((member) =>
      includesQuery(
        joinFields([member.name, member.relationship, member.note, member.allergySummary]),
        query,
      ),
    )
    .slice(0, RESULT_LIMIT)
    .map((member) => ({
      id: member.id,
      category: "member",
      label: `成员 · ${member.name}`,
      detail: `${member.relationship} · ${member.allergySummary}`,
      href: `/members/${member.id}`,
    }))
}

function searchRecords(records: MedicalRecord[], members: Member[], query: string): SearchResultItem[] {
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  return records
    .filter((record) =>
      includesQuery(
        joinFields([
          record.diagnosis,
          record.symptoms,
          record.doctorAdvice,
          record.hospitalName,
          record.department,
          record.note,
          memberNameById.get(record.memberId),
        ]),
        query,
      ),
    )
    .slice(0, RESULT_LIMIT)
    .map((record) => ({
      id: record.id,
      category: "record",
      label: `病历 · ${record.diagnosis}`,
      detail: `${memberNameById.get(record.memberId) ?? "未知成员"} · ${record.visitedAt} · ${record.symptoms}`,
      href: `/records?member=${record.memberId}`,
    }))
}

function searchMedicines(medicines: Medicine[], members: Member[], query: string): SearchResultItem[] {
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  return medicines
    .filter((medicine) =>
      includesQuery(
        joinFields([
          medicine.name,
          medicine.category,
          medicine.purpose,
          medicine.instructions,
          medicine.usageNote,
          medicine.safetyNote,
          memberNameById.get(medicine.memberId),
        ]),
        query,
      ),
    )
    .slice(0, RESULT_LIMIT)
    .map((medicine) => ({
      id: medicine.id,
      category: "medicine",
      label: `药品 · ${medicine.name}`,
      detail: `${memberNameById.get(medicine.memberId) ?? "未知成员"} · ${medicine.purpose}`,
      href: `/medicines?q=${encodeURIComponent(medicine.name)}&member=${medicine.memberId}`,
    }))
}

function searchAllergies(allergies: AllergyRecord[], members: Member[], query: string): SearchResultItem[] {
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))

  return allergies
    .filter((allergy) =>
      includesQuery(
        joinFields([
          allergy.allergen,
          allergy.reaction,
          allergy.severity,
          allergy.note,
          memberNameById.get(allergy.memberId),
        ]),
        query,
      ),
    )
    .slice(0, RESULT_LIMIT)
    .map((allergy) => ({
      id: allergy.id,
      category: "allergy",
      label: `过敏 · ${allergy.allergen}`,
      detail: `${memberNameById.get(allergy.memberId) ?? "未知成员"} · ${allergy.severity} · ${allergy.reaction}`,
      href: `/allergies?member=${allergy.memberId}`,
    }))
}

const defaultDependencies: VaultSearchDependencies = {
  listMembers,
  listMedicalRecords,
  listMedicines,
  listAllergyRecords,
  summarizeResults: defaultSummarizeResults,
}

export async function searchVault(
  ctx: RepositoryContext,
  query: string,
  dependencies: Partial<VaultSearchDependencies> = {},
): Promise<VaultSearchResponse> {
  const runtime = {
    ...defaultDependencies,
    ...dependencies,
  }

  const normalizedQuery = normalizeQuery(query)

  if (!normalizedQuery) {
    return {
      query: "",
      summary: "请输入搜索关键词。",
      results: [],
      counts: { members: 0, records: 0, medicines: 0, allergies: 0 },
    }
  }

  const [members, records, medicines, allergies] = await Promise.all([
    runtime.listMembers(ctx),
    runtime.listMedicalRecords(ctx),
    runtime.listMedicines(ctx),
    runtime.listAllergyRecords(ctx),
  ])

  const memberResults = searchMembers(members, normalizedQuery)
  const recordResults = searchRecords(records, members, normalizedQuery)
  const medicineResults = searchMedicines(medicines, members, normalizedQuery)
  const allergyResults = searchAllergies(allergies, members, normalizedQuery)

  const results = [...memberResults, ...recordResults, ...medicineResults, ...allergyResults]
  const summary = await runtime.summarizeResults({ query, results })

  return {
    query,
    summary,
    results,
    counts: {
      members: memberResults.length,
      records: recordResults.length,
      medicines: medicineResults.length,
      allergies: allergyResults.length,
    },
  }
}

export { buildFallbackSummary, includesQuery }
