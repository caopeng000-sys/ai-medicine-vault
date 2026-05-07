import type { AllergyRecord, MedicalRecord, Medicine, Member, VisitPreparation } from "./data"
import { getMedicineStatus } from "./data"

export type AssistantIntent =
  | "recent_cold_record"
  | "allergy_history"
  | "medicine_usage"
  | "medicine_interaction"
  | "medicine_disposal"
  | "recent_medicine_history"
  | "symptom_history"
  | "medicine_allergy_conflict"
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

export type AssistantRecentMedicineHistoryMatch = Readonly<{
  record?: MedicalRecord
  medicine?: Medicine
  member?: Member
  reason: string
}>

export type AssistantSymptomHistoryMatch = Readonly<{
  record: MedicalRecord
  member?: Member
  matchedSymptoms: string[]
}>

export type AssistantMedicineAllergyConflictMatch = Readonly<{
  medicine?: Medicine
  allergy?: AllergyRecord
  member?: Member
  riskText: string
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
const MEDICINE_DISPOSAL_KEYWORDS = [
  "过期药",
  "过期",
  "到期",
  "失效",
  "怎么处理",
  "如何处理",
  "怎么丢",
  "怎么扔",
  "还能吃",
  "还能不能吃",
  "还能用吗",
  "过期药怎么办",
  "临期药",
]
const VISIT_PREPARATION_KEYWORDS = ["复诊", "就医准备", "就诊前", "就医前", "看医生前", "带什么", "准备什么", "检查前"]
const RECENT_MEDICINE_HISTORY_KEYWORDS = ["最近吃过哪些药", "最近用过哪些药", "最近吃了什么药", "最近用了什么药", "这段时间吃了什么药", "用药记录", "吃药记录"]
const SYMPTOM_HISTORY_KEYWORDS = ["看过几次", "历史回顾", "之前有没有", "以前有没有", "最近有没有", "就医几次", "病历里有没有"]
const MEDICINE_ALLERGY_CONFLICT_KEYWORDS = [
  "过敏史有没有冲突",
  "和过敏史有没有冲突",
  "会不会和过敏史冲突",
  "过敏史冲突",
  "过敏冲突",
  "过敏风险",
  "会不会过敏",
  "用药前要不要注意过敏",
  "用药前要不要注意过敏史",
  "和我的过敏史",
]
const COMMON_SYMPTOM_TERMS = ["咳嗽", "鼻塞", "流涕", "发热", "发烧", "低烧", "咽喉", "头晕", "皮疹", "瘙痒", "腹泻", "呕吐", "疼痛", "鼻炎"]

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
    record.clinicalSummary,
    record.examinationResults,
    record.followUpAt,
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
        parsed.intent === "medicine_disposal" ||
        parsed.intent === "recent_medicine_history" ||
        parsed.intent === "symptom_history" ||
        parsed.intent === "medicine_allergy_conflict" ||
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

  if (MEDICINE_ALLERGY_CONFLICT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "medicine_allergy_conflict"
  }

  if (MEDICINE_INTERACTION_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "medicine_interaction"
  }

  if (MEDICINE_DISPOSAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "medicine_disposal"
  }

  if (RECENT_MEDICINE_HISTORY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "recent_medicine_history"
  }

  const medicineQuestionKeywords = ["家里有哪些", "有哪些药", "药品", "常备药", "止咳", "抗咳嗽药", "咳嗽药", "抗过敏药", "退烧药", "感冒药", "止痛药"]
  if (medicineQuestionKeywords.some((keyword) => normalized.includes(keyword))) {
    return "medicine_query"
  }

  const hasSymptomHistoryHint = SYMPTOM_HISTORY_KEYWORDS.some((keyword) => normalized.includes(keyword))
  const hasSymptomTerm = COMMON_SYMPTOM_TERMS.some((keyword) => normalized.includes(keyword))
  if (hasSymptomHistoryHint && hasSymptomTerm) {
    return "symptom_history"
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

function stripMedicineDisposalKeywords(question: string) {
  return MEDICINE_DISPOSAL_KEYWORDS.reduce((current, keyword) => current.replaceAll(keyword, " "), question.toLowerCase())
    .replace(/[？?。！!、,，/·]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function findTargetMember(question: string, members: Member[]) {
  const memberByName = members.find((member) => question.includes(member.name))
  const selfMember = question.includes("我") || question.includes("本人") || question.includes("自己")
    ? members.find((member) => member.relationship === "本人")
    : undefined

  return memberByName ?? selfMember
}

function getQuestionSymptomTerms(question: string) {
  return COMMON_SYMPTOM_TERMS.filter((term) => question.includes(term))
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

export function findMedicineDisposalGuidance(
  medicines: Medicine[],
  members: Member[],
  question: string,
): AssistantMedicineUsageMatch[] {
  const normalizedQuestion = question.trim().toLowerCase()
  const strippedQuestion = stripMedicineDisposalKeywords(question)
  const questionTerms = normalizeQuestionTerms(question)
  const disposalHints = ["过期", "到期", "失效", "临期", "处理", "丢弃", "扔掉", "还能吃", "还能用"]

  const matchedMedicines = medicines.filter((medicine) => {
    const status = getMedicineStatus(medicine.expiresAt, medicine.quantity)
    if (status.label !== "已过期" && status.label !== "即将过期") {
      return false
    }

    if (medicine.category.includes("设备") || medicine.category.includes("耗材")) {
      return false
    }

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
    const hasDisposalHint = disposalHints.some((hint) => normalizedQuestion.includes(hint)) && text.includes(medicine.name.toLowerCase())

    return hasDirectMedicineName || hasQuestionTermMatch || hasDisposalHint || disposalHints.some((hint) => normalizedQuestion.includes(hint))
  })

  return matchedMedicines
    .map((medicine) => ({
      medicine,
      member: members.find((item) => item.id === medicine.memberId),
    }))
    .sort((left, right) => {
      const leftStatus = getMedicineStatus(left.medicine.expiresAt, left.medicine.quantity)
      const rightStatus = getMedicineStatus(right.medicine.expiresAt, right.medicine.quantity)

      if (leftStatus.label !== rightStatus.label) {
        return leftStatus.label === "已过期" ? -1 : 1
      }

      return left.medicine.expiresAt.localeCompare(right.medicine.expiresAt, "zh-Hans-CN")
    })
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

export function findRecentMedicineHistory(
  records: MedicalRecord[],
  medicines: Medicine[],
  members: Member[],
  question: string,
): AssistantRecentMedicineHistoryMatch[] {
  const targetMember = findTargetMember(question, members)
  const scopedRecords = targetMember ? records.filter((record) => record.memberId === targetMember.id) : records
  const scopedMedicines = targetMember ? medicines.filter((medicine) => medicine.memberId === targetMember.id) : medicines
  const medicineNames = scopedMedicines.flatMap((medicine) => [medicine.name, ...medicineNameFragments(medicine.name)])
  const recordMatches = scopedRecords
    .filter((record) => {
      const text = [
        record.prescriptionNote,
        record.doctorAdvice,
        record.note,
        record.clinicalSummary,
      ]
        .join(" ")
        .toLowerCase()

      return (
        medicineNames.some((name) => name.length > 1 && text.includes(name.toLowerCase())) ||
        ["服用", "用药", "处方", "药"].some((keyword) => text.includes(keyword))
      )
    })
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
    .slice(0, 5)
    .map((record) => ({
      record,
      member: members.find((item) => item.id === record.memberId),
      reason: "病历中包含处方、用药或药品相关记录。",
    }))

  const recentMedicineIds = new Set(
    recordMatches.flatMap((match) => {
      const text = joinRecordText(match.record)
      return scopedMedicines
        .filter((medicine) => medicineNameFragments(medicine.name).some((fragment) => text.includes(fragment)))
        .map((medicine) => medicine.id)
    })
  )
  const medicineMatches = scopedMedicines
    .filter((medicine) => recentMedicineIds.has(medicine.id))
    .map((medicine) => ({
      medicine,
      member: members.find((item) => item.id === medicine.memberId),
      reason: "药品库中存在与近期病历用药线索对应的药品。",
    }))

  return [...recordMatches, ...medicineMatches]
}

export function findSymptomHistory(
  records: MedicalRecord[],
  members: Member[],
  question: string,
): AssistantSymptomHistoryMatch[] {
  const targetMember = findTargetMember(question, members)
  const symptomTerms = getQuestionSymptomTerms(question)
  const scopedRecords = targetMember ? records.filter((record) => record.memberId === targetMember.id) : records
  const termsToUse = symptomTerms.length ? symptomTerms : normalizeQuestionTerms(question)

  return scopedRecords
    .flatMap((record) => {
      const text = joinRecordText(record)
      const matchedSymptoms = termsToUse.filter((term) => text.includes(term.toLowerCase()))

      return matchedSymptoms.length
        ? [{
            record,
            member: members.find((item) => item.id === record.memberId),
            matchedSymptoms,
          }]
        : []
    })
    .sort((a, b) => b.record.visitedAt.localeCompare(a.record.visitedAt))
}

export function findMedicineAllergyConflicts(
  medicines: Medicine[],
  allergies: AllergyRecord[],
  members: Member[],
  question: string,
): AssistantMedicineAllergyConflictMatch[] {
  const targetMember = findTargetMember(question, members)
  const scopedAllergies = targetMember ? allergies.filter((record) => record.memberId === targetMember.id) : allergies
  const questionTerms = normalizeQuestionTerms(question)
  const mentionedMedicines = medicines.filter((medicine) => {
    const medicineText = joinMedicineText(medicine)
    return (
      question.includes(medicine.name) ||
      medicineNameFragments(medicine.name).some((fragment) => question.includes(fragment)) ||
      questionTerms.some((term) => medicineText.includes(term))
    )
  })
  const medicinesToCheck = mentionedMedicines.length
    ? mentionedMedicines
    : targetMember
      ? medicines.filter((medicine) => medicine.memberId === targetMember.id)
      : medicines
  const matches = medicinesToCheck.flatMap((medicine) => {
    const medicineText = joinMedicineText(medicine)
    const relatedAllergies = scopedAllergies.filter((allergy) => {
      const allergyText = joinAllergyText(allergy)
      const allergenFragments = medicineNameFragments(allergy.allergen)
      return (
        medicineText.includes(allergy.allergen.toLowerCase()) ||
        allergyText.includes(medicine.name.toLowerCase()) ||
        medicineNameFragments(medicine.name).some((fragment) => allergyText.includes(fragment)) ||
        allergenFragments.some((fragment) => medicineText.includes(fragment))
      )
    })

    const allergiesToReturn = relatedAllergies.length ? relatedAllergies : scopedAllergies

    return allergiesToReturn.map((allergy) => ({
      medicine,
      allergy,
      member: members.find((item) => item.id === medicine.memberId || item.id === allergy.memberId),
      riskText: relatedAllergies.length
        ? "药品资料和过敏记录存在直接文本命中，需要重点核对。"
        : "未发现直接文本命中，但存在过敏/不良反应记录，用药前仍建议核对。",
    }))
  })

  if (matches.length) {
    return matches.slice(0, 8)
  }

  return scopedAllergies.slice(0, 5).map((allergy) => ({
    allergy,
    member: members.find((item) => item.id === allergy.memberId),
    riskText: "未匹配到具体药品，但存在过敏/不良反应记录。",
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
