import type { AllergyRecord, MedicalRecord, Medicine, Member } from "./data"

export type AssistantIntent =
  | "recent_cold_record"
  | "medicine_query"
  | "allergy_query"
  | "visit_prep_query"
  | "open_query"
  | "unsupported"

export type AssistantIntentParseResult = Readonly<{
  intent: AssistantIntent
  reason: string
}>

export type AssistantRecordMatch = Readonly<{
  record: MedicalRecord
  member?: Member
}>

export type AssistantMedicineMatch = Readonly<{
  medicine: Medicine
  member?: Member
}>

export type AssistantAllergyMatch = Readonly<{
  record: AllergyRecord
  member?: Member
}>

export type AssistantVisitPrepSource = Readonly<{
  label: string
  detail: string
}>

const COLD_KEYWORDS = ["感冒", "上呼吸道感染", "流涕", "鼻塞", "咳嗽", "发热"]
const ALLERGY_KEYWORDS = ["抗过敏", "过敏性鼻炎", "过敏", "荨麻疹", "打喷嚏", "流清涕", "鼻炎"]

function joinMedicineText(medicine: Medicine) {
  return [
    medicine.name,
    medicine.category,
    medicine.dosage,
    medicine.instructions,
    medicine.purpose,
    medicine.specification,
    medicine.storageLocation,
    medicine.usageNote,
    medicine.safetyNote,
  ]
    .join(" ")
    .toLowerCase()
}

function joinRecordText(record: MedicalRecord) {
  return [
    record.symptoms,
    record.diagnosis,
    record.doctorAdvice,
    record.prescriptionNote,
    record.note,
  ]
    .join(" ")
    .toLowerCase()
}

const SUPPORTED_INTENTS = new Set<AssistantIntent>([
  "recent_cold_record",
  "medicine_query",
  "allergy_query",
  "visit_prep_query",
  "open_query",
])

export function parseAssistantIntent(rawText: string): AssistantIntentParseResult {
  try {
    const parsed = JSON.parse(rawText) as Partial<AssistantIntentParseResult>

    return {
      intent:
        typeof parsed.intent === "string" && SUPPORTED_INTENTS.has(parsed.intent as AssistantIntent)
          ? (parsed.intent as AssistantIntent)
          : "unsupported",
      reason: typeof parsed.reason === "string" && parsed.reason.trim() ? parsed.reason.trim() : "未返回原因",
    }
  } catch {
    return {
      intent: "unsupported",
      reason: "无法解析模型返回结果",
    }
  }
}

export function detectAssistantIntent(question: string): AssistantIntent {
  const normalized = question.trim()

  if (!normalized) {
    return "unsupported"
  }

  const visitPrepKeywords = [
    "看医生前",
    "就医前",
    "复诊前",
    "就诊前",
    "看病前",
    "准备哪些问题",
    "应该问",
    "要问医生",
    "就医准备",
    "就诊准备",
  ]
  if (visitPrepKeywords.some((keyword) => normalized.includes(keyword))) {
    return "visit_prep_query"
  }

  const coldQuestionKeywords = ["感冒", "发烧", "发热", "咳嗽", "鼻塞", "流涕", "上呼吸道感染"]
  if (coldQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "recent_cold_record"
  }

  const allergyHistoryKeywords = [
    "有过不适",
    "过敏史",
    "过敏记录",
    "药物过敏",
    "不良反应",
    "对哪些药",
    "哪些过敏",
    "什么过敏",
    "过敏原",
  ]
  if (allergyHistoryKeywords.some((keyword) => normalized.includes(keyword))) {
    return "allergy_query"
  }

  if (normalized.includes("过敏") && !normalized.includes("有哪些") && !normalized.includes("常备")) {
    return "allergy_query"
  }

  const medicineQuestionKeywords = ["药", "药品", "用药", "常备药", "止咳", "咳嗽", "鼻炎", "感冒", "发烧"]
  if (medicineQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "medicine_query"
  }

  return "unsupported"
}

export function detectOpenQueryIntent(question: string): "open_query" | null {
  const normalized = question.trim()

  if (!normalized) {
    return null
  }

  const openQueryKeywords = [
    "报告",
    "记录里",
    "记录中",
    "查到过",
    "哪次",
    "有没有",
    "趋势",
    "化验",
    "检查",
    "血糖",
    "白细胞",
    "血压",
    "档案",
    "资料里",
    "之前",
    "曾经",
    "历史",
    "在哪",
    "什么时候",
  ]

  if (openQueryKeywords.some((keyword) => normalized.includes(keyword))) {
    return "open_query"
  }

  return null
}

export function findRecentColdRecord(records: MedicalRecord[], members: Member[]): AssistantRecordMatch | undefined {
  const matches = records
    .filter((record) => COLD_KEYWORDS.some((keyword) => joinRecordText(record).includes(keyword.toLowerCase())))
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))

  const record = matches[0]
  if (!record) return undefined

  return {
    record,
    member: members.find((item) => item.id === record.memberId),
  }
}

export function findAntiallergicMedicines(
  medicines: Medicine[],
  members: Member[],
): AssistantMedicineMatch[] {
  return medicines
    .filter((medicine) => {
      const text = joinMedicineText(medicine)
      return ALLERGY_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase())) || text.includes("抗过敏")
    })
    .map((medicine) => ({
      medicine,
      member: members.find((item) => item.id === medicine.memberId),
    }))
}

export function buildAllergyMatches(records: AllergyRecord[], members: Member[]): AssistantAllergyMatch[] {
  return records
    .slice()
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
    .map((record) => ({
      record,
      member: members.find((item) => item.id === record.memberId),
    }))
}

export function buildVisitPrepSources(
  members: Member[],
  records: MedicalRecord[],
  medicines: Medicine[],
  allergies: AllergyRecord[],
): AssistantVisitPrepSource[] {
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))
  const sources: AssistantVisitPrepSource[] = []

  for (const record of records.slice().sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)).slice(0, 3)) {
    sources.push({
      label: `病历 · ${memberNameById.get(record.memberId) ?? "未知成员"}`,
      detail: `${record.visitedAt} · ${record.diagnosis} · ${record.symptoms}`,
    })
  }

  for (const { record, member } of buildAllergyMatches(allergies, members)) {
    sources.push({
      label: `过敏 · ${record.allergen}`,
      detail: `${member?.name ?? "未知成员"} · ${record.severity} · ${record.reaction}`,
    })
  }

  for (const medicine of medicines
    .slice()
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
    .slice(0, 5)) {
    sources.push({
      label: `药品 · ${medicine.name}`,
      detail: `${memberNameById.get(medicine.memberId) ?? "未知成员"} · ${medicine.purpose} · 有效期 ${medicine.expiresAt}`,
    })
  }

  return sources
}
