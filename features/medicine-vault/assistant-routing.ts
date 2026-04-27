import type { MedicalRecord, Medicine, Member } from "./data"

export type AssistantIntent = "recent_cold_record" | "medicine_query" | "unsupported"

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

export function parseAssistantIntent(rawText: string): AssistantIntentParseResult {
  try {
    const parsed = JSON.parse(rawText) as Partial<AssistantIntentParseResult>

    return {
      intent:
        parsed.intent === "recent_cold_record" || parsed.intent === "medicine_query" ? parsed.intent : "unsupported",
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

  const coldQuestionKeywords = ["感冒", "发烧", "发热", "咳嗽", "鼻塞", "流涕", "上呼吸道感染"]
  if (coldQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "recent_cold_record"
  }

  const medicineQuestionKeywords = ["药", "药品", "用药", "常备药", "止咳", "咳嗽", "过敏", "鼻炎", "感冒", "发烧"]
  if (medicineQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "medicine_query"
  }

  return "unsupported"
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
