import type { AllergyRecord } from "./data"

export type MedicineAllergyCheckInput = Readonly<{
  name: string
  purpose: string
  warnings: readonly string[]
  originalText: string
}>

export type AllergyCrossCheckWarning = Readonly<{
  allergyRecordId: string
  allergen: string
  severity: AllergyRecord["severity"]
  reaction: string
  matchedTerms: readonly string[]
  matchedFields: readonly string[]
  message: string
}>

export type AllergyCrossCheckResult = Readonly<{
  warnings: readonly AllergyCrossCheckWarning[]
  hasRisk: boolean
  disclaimer: string
}>

const ALLERGY_CROSS_CHECK_DISCLAIMER =
  "以下为基于已录入过敏记录与识别文本的交叉提醒，仅用于资料整理，不构成诊断或用药建议。如有疑问请咨询医生。"

const ALLERGEN_ALIASES: Readonly<Record<string, readonly string[]>> = {
  青霉素: ["青霉素", "盘尼西林", "阿莫西林", "氨苄西林", "penicillin", "amoxicillin", "ampicillin"],
  头孢: ["头孢", "cephalosporin", "cef"],
  海鲜: ["海鲜", "虾", "蟹", "贝类", "shellfish", "shrimp", "crab"],
  花生: ["花生", "peanut"],
  牛奶: ["牛奶", "乳制品", "milk", "dairy"],
  鸡蛋: ["鸡蛋", "egg"],
  磺胺: ["磺胺", "sulfa", "sulfonamide"],
  阿司匹林: ["阿司匹林", "aspirin", "水杨酸"],
}

type MedicineFieldLabel = "name" | "purpose" | "originalText" | `warnings[${number}]`

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

function buildSearchTerms(allergen: string) {
  const normalizedAllergen = normalizeText(allergen)
  const aliasEntry = Object.entries(ALLERGEN_ALIASES).find(([key]) => normalizedAllergen.includes(normalizeText(key)))

  if (aliasEntry) {
    return [...new Set([allergen.trim(), ...aliasEntry[1]])].filter((term) => term.length >= 2)
  }

  return allergen.trim().length >= 2 ? [allergen.trim()] : []
}

function collectMedicineFields(medicine: MedicineAllergyCheckInput): Array<[MedicineFieldLabel, string]> {
  const fields: Array<[MedicineFieldLabel, string]> = [
    ["name", medicine.name],
    ["purpose", medicine.purpose],
    ["originalText", medicine.originalText],
  ]

  medicine.warnings.forEach((warning, index) => {
    fields.push([`warnings[${index}]`, warning])
  })

  return fields
}

function findMatches(medicine: MedicineAllergyCheckInput, searchTerms: readonly string[]) {
  const matchedTerms = new Set<string>()
  const matchedFields = new Set<string>()

  for (const [field, value] of collectMedicineFields(medicine)) {
    const normalizedValue = normalizeText(value)

    if (!normalizedValue) {
      continue
    }

    for (const term of searchTerms) {
      const normalizedTerm = normalizeText(term)

      if (normalizedTerm.length < 2) {
        continue
      }

      if (normalizedValue.includes(normalizedTerm)) {
        matchedTerms.add(term)
        matchedFields.add(field)
      }
    }
  }

  return {
    matchedTerms: [...matchedTerms],
    matchedFields: [...matchedFields],
  }
}

function buildWarningMessage(allergen: string, matchedTerms: readonly string[], matchedFields: readonly string[]) {
  const termText = matchedTerms.join("、")
  const fieldText = matchedFields
    .map((field) => {
      if (field.startsWith("warnings")) {
        return "识别提醒"
      }

      switch (field) {
        case "name":
          return "药品名称"
        case "purpose":
          return "治疗范围"
        case "originalText":
          return "识别原文"
        default:
          return field
      }
    })
    .join("、")

  return `识别内容中出现与「${allergen}」相关的表述（${termText}），匹配字段：${fieldText}。请核对成员过敏记录后再录入。`
}

export function crossCheckMedicineAgainstAllergies(
  medicine: MedicineAllergyCheckInput,
  allergies: readonly AllergyRecord[],
): AllergyCrossCheckResult {
  const warnings: AllergyCrossCheckWarning[] = []

  for (const allergy of allergies) {
    const searchTerms = buildSearchTerms(allergy.allergen)
    const { matchedTerms, matchedFields } = findMatches(medicine, searchTerms)

    if (matchedTerms.length === 0) {
      continue
    }

    warnings.push({
      allergyRecordId: allergy.id,
      allergen: allergy.allergen,
      severity: allergy.severity,
      reaction: allergy.reaction,
      matchedTerms,
      matchedFields,
      message: buildWarningMessage(allergy.allergen, matchedTerms, matchedFields),
    })
  }

  return {
    warnings,
    hasRisk: warnings.length > 0,
    disclaimer: ALLERGY_CROSS_CHECK_DISCLAIMER,
  }
}

export function crossCheckMedicineForMember(
  memberId: string,
  medicine: MedicineAllergyCheckInput,
  allergies: readonly AllergyRecord[],
): AllergyCrossCheckResult {
  const memberAllergies = allergies.filter((record) => record.memberId === memberId)
  return crossCheckMedicineAgainstAllergies(medicine, memberAllergies)
}
