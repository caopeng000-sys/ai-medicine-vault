export type ExtractedMedicalAttachmentResult = Readonly<{
  extractedText: string
  visitedAt: string
  hospital: string
  diagnosis: string
  reportType: string
  summary: string
  warnings: string[]
}>
