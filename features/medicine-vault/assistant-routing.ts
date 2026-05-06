import type { AllergyRecord, MedicalRecord, Medicine, Member, VisitPreparation } from "./data"

export type AssistantIntent =
  | "recent_cold_record"
  | "allergy_history"
  | "medicine_usage"
  | "medicine_interaction"
  | "medicine_query"
  | "visit_preparation"
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

export type AssistantMedicineUsageMatch = Readonly<{
  medicine: Medicine
  member?: Member
}>

export type AssistantAllergyMatch = Readonly<{
  record: AllergyRecord
  member?: Member
}>

export type AssistantVisitPreparationMatch = Readonly<{
  visitPreparation: VisitPreparation
  member?: Member
}>

const COLD_KEYWORDS = ["感冒", "上呼吸道感染", "流涕", "鼻塞", "咳嗽", "发热"]
const ALLERGY_KEYWORDS = ["抗过敏", "过敏性鼻炎", "过敏", "荨麻疹", "打喷嚏", "流清涕", "鼻炎"]
const ALLERGY_HISTORY_KEYWORDS = [
  "过敏史",
  "不良反应",
  "不适",
  "药疹",
  "皮疹",
  "瘙痒",
  "青霉素",
  "阿司匹林",
  "药物过敏",
]
const MEDICINE_USAGE_KEYWORDS = [
  "怎么吃",
  "怎么用",
  "怎么服",
  "服用方法",
  "用法",
  "用量",
  "饭前",
  "饭后",
  "空腹",
  "注意事项",
  "禁忌",
  "间隔",
  "多久吃一次",
  "一天几次",
  "一次几片",
  "怎么服用",
  "怎么使用",
]
const MEDICINE_INTERACTION_KEYWORDS = [
  "相互作用",
  "同服",
  "一起吃",
  "能不能一起吃",
  "联用",
  "不能同服",
  "重复成分",
  "一起用",
  "能一起吃",
  "可不可以一起吃",
]
const VISIT_PREPARATION_KEYWORDS = ["复诊", "就医准备", "就诊前", "就医前", "看医生前", "带什么", "准备什么", "检查前"]

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
    record.examinationResults,
    record.doctorAdvice,
    record.prescriptionNote,
    record.note,
  ]
    .join(" ")
    .toLowerCase()
}

function joinAllergyText(record: AllergyRecord) {
  return [
    record.allergen,
    record.reaction,
    record.severity,
    record.discoveredAt,
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
        parsed.intent === "recent_cold_record" ||
        parsed.intent === "allergy_history" ||
        parsed.intent === "medicine_usage" ||
        parsed.intent === "medicine_interaction" ||
        parsed.intent === "medicine_query" ||
        parsed.intent === "visit_preparation"
          ? parsed.intent
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

  if (MEDICINE_INTERACTION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "medicine_interaction"
  }

  const coldQuestionKeywords = ["感冒", "发烧", "发热", "咳嗽", "鼻塞", "流涕", "上呼吸道感染"]
  if (coldQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "recent_cold_record"
  }

  const allergyHistoryKeywords = ["过敏史", "不良反应", "不适", "药物过敏", "药疹", "皮疹", "瘙痒", "青霉素", "阿司匹林"]
  if (allergyHistoryKeywords.some((keyword) => normalized.includes(keyword))) {
    return "allergy_history"
  }

  if (MEDICINE_USAGE_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "medicine_usage"
  }

  const medicineQuestionKeywords = ["家里有哪些", "有哪些药", "药品", "常备药", "止咳", "咳嗽", "抗过敏药", "退烧药", "感冒药", "止痛药"]
  if (medicineQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "medicine_query"
  }

  if (VISIT_PREPARATION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "visit_preparation"
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

function normalizeQuestionTerms(question: string) {
  return question
    .trim()
    .toLowerCase()
    .replace(/[？?。！!、,，]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

function stripMedicineUsageKeywords(question: string) {
  return MEDICINE_USAGE_KEYWORDS.reduce((current, keyword) => current.replaceAll(keyword, " "), question.toLowerCase())
    .replace(/[？?。！!、,，/·]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stripMedicineInteractionKeywords(question: string) {
  return MEDICINE_INTERACTION_KEYWORDS.reduce((current, keyword) => current.replaceAll(keyword, " "), question.toLowerCase())
    .replace(/[？?。！!、,，/·]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function medicineNameFragments(medicineName: string) {
  return medicineName
    .toLowerCase()
    .replace(/[（）()【】\[\]·、,，/]/g, " ")
    .split(/\s+/)
    .flatMap((part) => part.split(/(缓释|控释|胶囊|片|颗粒|口服液|喷雾|滴剂|软膏|贴|丸|冲剂|糖浆|注射液)/g))
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
}

export function findMedicineUsageGuidance(
  medicines: Medicine[],
  members: Member[],
  question: string,
): AssistantMedicineUsageMatch[] {
  const normalizedQuestion = question.trim().toLowerCase()
  const strippedQuestion = stripMedicineUsageKeywords(question)
  const questionTerms = normalizeQuestionTerms(question)
  const keywordHints = ["药", "片", "胶囊", "颗粒", "口服液", "喷雾", "滴剂", "软膏", "贴", "冲剂"]

  const matchedMedicines = medicines.filter((medicine) => {
    const text = joinMedicineText(medicine)
    const medicineFields = [
      medicine.name,
      medicine.category,
      medicine.dosage,
      medicine.instructions,
      medicine.purpose,
      medicine.specification,
      medicine.usageNote,
      medicine.safetyNote,
    ]
      .join(" ")
      .toLowerCase()

    const hasDirectMedicineName =
      medicineFields.includes(normalizedQuestion) ||
      normalizedQuestion.includes(medicine.name.toLowerCase()) ||
      (strippedQuestion.length > 0 && medicineFields.includes(strippedQuestion)) ||
      (strippedQuestion.length > 0 && medicine.name.toLowerCase().includes(strippedQuestion))
    const hasQuestionTermMatch = questionTerms.some((term) => medicineFields.includes(term) || strippedQuestion.includes(term))
    const hasKeywordHint = keywordHints.some((hint) => normalizedQuestion.includes(hint)) && questionTerms.some((term) => text.includes(term))

    return hasDirectMedicineName || hasQuestionTermMatch || hasKeywordHint
  })

  return matchedMedicines
    .map((medicine) => ({
      medicine,
      member: members.find((item) => item.id === medicine.memberId),
    }))
    .sort((left, right) => left.medicine.name.localeCompare(right.medicine.name, "zh-Hans-CN"))
}

export function findMedicineInteractionGuidance(
  medicines: Medicine[],
  members: Member[],
  question: string,
): AssistantMedicineUsageMatch[] {
  const normalizedQuestion = question.trim().toLowerCase()
  const strippedQuestion = stripMedicineInteractionKeywords(question)
  const questionTerms = normalizeQuestionTerms(question)
  const interactionHints = ["一起", "同服", "联用", "合用", "重复", "成分"]

  const matchedMedicines = medicines.filter((medicine) => {
    const text = joinMedicineText(medicine)
    const medicineFields = [
      medicine.name,
      medicine.category,
      medicine.dosage,
      medicine.instructions,
      medicine.purpose,
      medicine.specification,
      medicine.usageNote,
      medicine.safetyNote,
    ]
      .join(" ")
      .toLowerCase()

    const hasDirectMedicineName =
      medicineFields.includes(normalizedQuestion) ||
      normalizedQuestion.includes(medicine.name.toLowerCase()) ||
      (strippedQuestion.length > 0 && medicineFields.includes(strippedQuestion)) ||
      (strippedQuestion.length > 0 && medicine.name.toLowerCase().includes(strippedQuestion))
    const hasQuestionTermMatch =
      questionTerms.some((term) => medicineFields.includes(term) || strippedQuestion.includes(term)) ||
      medicineNameFragments(medicine.name).some((fragment) => normalizedQuestion.includes(fragment))
    const hasInteractionHint = interactionHints.some((hint) => normalizedQuestion.includes(hint)) && questionTerms.some((term) => text.includes(term))

    return hasDirectMedicineName || hasQuestionTermMatch || hasInteractionHint
  })

  return matchedMedicines
    .map((medicine) => ({
      medicine,
      member: members.find((item) => item.id === medicine.memberId),
    }))
    .sort((left, right) => left.medicine.name.localeCompare(right.medicine.name, "zh-Hans-CN"))
}

export function findAllergyHistory(
  records: AllergyRecord[],
  members: Member[],
  question: string,
): AssistantAllergyMatch[] {
  const normalizedQuestion = question.trim()
  const memberByName = members.find((member) => normalizedQuestion.includes(member.name))
  const selfMember = normalizedQuestion.includes("我") || normalizedQuestion.includes("本人") || normalizedQuestion.includes("自己")
    ? members.find((member) => member.relationship === "本人")
    : undefined
  const targetMemberId = memberByName?.id ?? selfMember?.id
  const candidateRecords = targetMemberId ? records.filter((record) => record.memberId === targetMemberId) : records

  const matchedRecords = candidateRecords.filter((record) => {
    const text = joinAllergyText(record)
    return (
      ALLERGY_HISTORY_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase())) ||
      normalizedQuestion.includes(record.allergen) ||
      normalizedQuestion.includes(record.reaction)
    )
  })

  const recordsToReturn = matchedRecords.length > 0 ? matchedRecords : candidateRecords

  return recordsToReturn
    .slice()
    .sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt))
    .map((record) => ({
      record,
      member: members.find((item) => item.id === record.memberId),
    }))
}

export function findVisitPreparation(
  preparations: VisitPreparation[],
  members: Member[],
  question: string,
): AssistantVisitPreparationMatch | undefined {
  const normalizedQuestion = question.trim()
  const memberByName = members.find((member) => normalizedQuestion.includes(member.name))
  const exactMemberPreparation = memberByName
    ? preparations.find((item) => item.memberId === memberByName.id)
    : undefined
  const preparation = exactMemberPreparation ?? preparations[0]

  if (!preparation) {
    return undefined
  }

  return {
    visitPreparation: preparation,
    member: members.find((item) => item.id === preparation.memberId),
  }
}
