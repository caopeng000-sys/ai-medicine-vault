import type { MedicalRecordAttachmentExtraction } from "./medical-record-attachment-extractor"

export type MedicalRecordAttachmentAiMetadata = Readonly<{
  documentType: string
  summary: string
  keyFindings: string[]
  suggestedFollowUp: string
  originalText: string
  warnings: string[]
}>

export type EncodedMedicalRecordAttachmentAiMetadata = Readonly<{
  aiDocumentType: string
  aiSummary: string
  aiKeyFindings: string
  aiSuggestedFollowUp: string
  aiOriginalText: string
  aiWarnings: string
}>

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeTextArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => normalizeText(item)).filter(Boolean)
    : []
}

function parseJsonArray(value: string) {
  if (!value.trim()) return []

  try {
    return normalizeTextArray(JSON.parse(value))
  } catch {
    return []
  }
}

function hasAiMetadata(metadata: MedicalRecordAttachmentAiMetadata) {
  return Boolean(
    metadata.documentType ||
      metadata.summary ||
      metadata.keyFindings.length ||
      metadata.suggestedFollowUp ||
      metadata.originalText ||
      metadata.warnings.length
  )
}

export function encodeMedicalRecordAttachmentAiMetadata(
  metadata: MedicalRecordAttachmentExtraction
): EncodedMedicalRecordAttachmentAiMetadata {
  return {
    aiDocumentType: normalizeText(metadata.documentType),
    aiSummary: normalizeText(metadata.summary),
    aiKeyFindings: JSON.stringify(normalizeTextArray(metadata.keyFindings)),
    aiSuggestedFollowUp: normalizeText(metadata.suggestedFollowUp),
    aiOriginalText: normalizeText(metadata.originalText),
    aiWarnings: JSON.stringify(normalizeTextArray(metadata.warnings)),
  }
}

export function parseMedicalRecordAttachmentAiMetadata(
  input: Partial<EncodedMedicalRecordAttachmentAiMetadata>
): MedicalRecordAttachmentAiMetadata | undefined {
  const metadata = {
    documentType: normalizeText(input.aiDocumentType),
    summary: normalizeText(input.aiSummary),
    keyFindings: parseJsonArray(normalizeText(input.aiKeyFindings)),
    suggestedFollowUp: normalizeText(input.aiSuggestedFollowUp),
    originalText: normalizeText(input.aiOriginalText),
    warnings: parseJsonArray(normalizeText(input.aiWarnings)),
  }

  return hasAiMetadata(metadata) ? metadata : undefined
}
