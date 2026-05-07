import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import { z } from "zod"

export const medicalRecordAttachmentExtractionSchema = z.object({
  documentType: z.string().trim().default(""),
  summary: z.string().trim().default(""),
  keyFindings: z.array(z.string().trim()).default([]),
  suggestedFollowUp: z.string().trim().default(""),
  originalText: z.string().trim().default(""),
  warnings: z.array(z.string().trim()).default([]),
})

export type MedicalRecordAttachmentExtraction = z.infer<typeof medicalRecordAttachmentExtractionSchema>

export function buildMedicalRecordAttachmentExtractionPrompt() {
  return [
    "你是一个家庭病历资料整理助手。",
    "请识别图片中的处方单、检查报告、化验单或就诊资料，并整理成结构化 JSON。",
    "只做资料归档和摘要，不给出诊断，不替代医生判断。",
    "请返回 documentType、summary、keyFindings、suggestedFollowUp、originalText、warnings。",
    "summary 用中文概括这份资料是什么。",
    "keyFindings 提取能看清的关键项目，例如检查指标、处方药名、医生提示。",
    "suggestedFollowUp 只整理资料中明确出现的复诊、观察或注意事项，不要臆测。",
    "warnings 记录看不清、信息不完整或需要医生确认的地方。",
    "请严格返回 JSON，不要输出额外说明。",
  ].join("\n")
}

function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const trimmed = text.trim()

  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error("AI 没有返回可解析的病历附件摘要。")
  }

  return trimmed
}

export async function extractMedicalRecordAttachmentFromImage(
  dataUrl: string
): Promise<MedicalRecordAttachmentExtraction> {
  const result = await createDashscopeChatCompletion({
    model: "qwen-vl-plus",
    messages: [
      {
        role: "system",
        content: "你是一个严谨的病历附件资料整理助手，只返回 JSON。",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildMedicalRecordAttachmentExtractionPrompt(),
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
  })

  return medicalRecordAttachmentExtractionSchema.parse(JSON.parse(extractJsonBlock(result)))
}
