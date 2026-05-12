import { z } from "zod"

const memberSchema = z.object({
  name: z.string().trim().min(1, "请填写成员姓名。"),
  relationship: z.string().trim().min(1, "请填写成员关系。"),
  gender: z.enum(["男", "女"], {
    error: "请选择成员性别。",
  }),
  birthYear: z
    .string()
    .trim()
    .min(1, "请填写出生年份。")
    .transform((value) => Number(value))
    .refine((value) => Number.isInteger(value) && value >= 1900 && value <= 2100, "出生年份格式不正确。"),
  note: z.string().trim().default(""),
})

export const createMemberSchema = memberSchema
export const updateMemberSchema = memberSchema

export const createMedicalRecordSchema = z.object({
  memberId: z.string().trim().min(1, "缺少成员信息。"),
  visitedAt: z.string().trim().min(1, "请填写就诊日期。"),
  hospital: z.string().trim().min(1, "请填写医院与科室。"),
  diagnosis: z.string().trim().min(1, "请填写诊断结论。"),
  clinicalSummary: z.string().trim().default(""),
  examinationResults: z.string().trim().default(""),
  followUpAt: z.string().trim().default(""),
  symptoms: z.string().trim().min(1, "请填写症状描述。"),
  advice: z.string().trim().min(1, "请填写医生建议。"),
})

export const createMedicineSchema = z.object({
  memberId: z.string().trim().min(1, "缺少成员信息。"),
  name: z.string().trim().min(1, "请填写药品名称。"),
  category: z.string().trim().min(1, "请填写药品分类。"),
  dosage: z.string().trim().min(1, "请填写剂量。"),
  specification: z.string().trim().min(1, "请填写规格。"),
  quantity: z.string().trim().default(""),
  storageLocation: z.string().trim().default(""),
  expiresAt: z.string().trim().min(1, "请填写有效期。"),
  instructions: z.string().trim().min(1, "请填写使用说明。"),
  purpose: z.string().trim().min(1, "请填写治疗疾病或适应症。"),
  usageNote: z.string().trim().default(""),
  safetyNote: z.string().trim().default(""),
})

export const createAllergyRecordSchema = z.object({
  memberId: z.string().trim().min(1, "缺少成员信息。"),
  allergen: z.string().trim().min(1, "请填写过敏原。"),
  discoveredAt: z.string().trim().min(1, "请填写发现时间。"),
  severity: z.enum(["轻微", "中等", "严重"], {
    error: "严重程度只能是轻微、中等或严重。",
  }),
  reaction: z.string().trim().min(1, "请填写反应描述。"),
  note: z.string().trim().default(""),
})

export const createKnowledgeDocumentSchema = z.object({
  title: z.string().trim().min(1, "请填写标题。"),
  category: z.string().trim().min(1, "请填写分类。"),
  source: z.string().trim().min(1, "请填写来源。"),
  content: z.string().trim().min(1, "请填写内容。"),
})

export const extractedMedicineSchema = z.object({
  name: z.string().trim().default(""),
  category: z.string().trim().default(""),
  dosage: z.string().trim().default(""),
  specification: z.string().trim().default(""),
  instructions: z.string().trim().default(""),
  purpose: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  warnings: z.array(z.string().trim()).default([]),
  originalText: z.string().trim().default(""),
})

export const medicineExtractionFieldNames = Object.keys(
  extractedMedicineSchema.shape
) as Array<keyof typeof extractedMedicineSchema.shape>

export type CreateMemberInput = z.infer<typeof createMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type CreateMedicalRecordInput = z.infer<typeof createMedicalRecordSchema>
export type CreateMedicineInput = z.infer<typeof createMedicineSchema>
export type CreateAllergyRecordInput = z.infer<typeof createAllergyRecordSchema>
export type CreateKnowledgeDocumentInput = z.infer<typeof createKnowledgeDocumentSchema>
export type ExtractedMedicineData = z.infer<typeof extractedMedicineSchema>
