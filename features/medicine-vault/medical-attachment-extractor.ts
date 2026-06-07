import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"
import { extractedMedicalAttachmentSchema, medicalAttachmentExtractionFieldNames } from "./schemas"
import type { ExtractedMedicalAttachmentData } from "./schemas"

export function buildMedicalAttachmentExtractionPrompt() {
  return [
    "你是一个用于家庭健康资料整理的视觉识别助手。",
    "请完整识别病历附件、检查报告、化验单图片中的可见原文，并整理元数据。",
    "请严格返回 JSON。",
  ].join("\n")
}

function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()
  const trimmed = text.trim()
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) throw new Error("AI 没有返回可解析的结构化结果。")
  return trimmed
}

export async function extractMedicalAttachmentFromImage(dataUrl: string): Promise<ExtractedMedicalAttachmentData> {
  const prompt = [buildMedicalAttachmentExtractionPrompt(), "JSON 字段：", medicalAttachmentExtractionFieldNames.join(", ")].join("\n")
  const result = await createDashscopeChatCompletion({
    model: "qwen-vl-plus",
    messages: [
      { role: "system", content: "你是一个严谨的病历附件 OCR 助手，只返回 JSON。" },
      { role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: dataUrl } }] },
    ],
  })
  return extractedMedicalAttachmentSchema.parse(JSON.parse(extractJsonBlock(result)))
}
