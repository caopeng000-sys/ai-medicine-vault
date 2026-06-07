import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import { extractedMedicalRecordSchema, medicalRecordExtractionFieldNames } from "./schemas"

import type { ExtractedMedicalRecordData } from "./schemas"

export function buildMedicalRecordExtractionPrompt() {
  return [
    "你是一个用于家庭健康资料整理的视觉识别助手。",
    "先尽量识别病历、门诊报告或处方单图片中的原文，再基于原文整理结构化字段。",
    "请返回原文、就诊日期、医院与科室、诊断结论、症状描述、医生建议、摘要和低置信度提醒。",
    "就诊日期请尽量整理为 YYYY-MM-DD 格式；如果图片只有年月日中文写法，也请转换为标准日期。",
    "医院与科室请合并为一条信息，例如：市立医院 / 呼吸科。",
    "症状描述和医生建议要尽量整理成可以直接录入的中文短句；如果图片信息不完整，也请根据可见内容做出最接近的整理，并在 warnings 里说明不确定点。",
    "如果看不清，请返回空字符串，但不要因为信息碎片化就放弃总结。",
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
    throw new Error("AI 没有返回可解析的结构化结果。")
  }

  return trimmed
}

export async function extractMedicalRecordFromImage(dataUrl: string): Promise<ExtractedMedicalRecordData> {
  const prompt = [
    buildMedicalRecordExtractionPrompt(),
    "请只根据图片中的病历、门诊报告或处方单原文提取信息，不要臆测。",
    "JSON 字段必须包含：",
    medicalRecordExtractionFieldNames.join(", "),
    "其中：",
    "- visitedAt 表示就诊日期，格式尽量为 YYYY-MM-DD。",
    "- hospital 表示医院名称与科室，用简短中文说明。",
    "- diagnosis 表示诊断结论或初步诊断。",
    "- symptoms 表示就诊时的主要症状和持续时间。",
    "- advice 表示医生建议、复诊建议、观察点或禁忌提醒。",
    "- summary 说明你主要从图片里识别到了什么，哪些字段可信，哪些字段不清晰。",
    "- warnings 是字符串数组，用来列出低置信度提醒。",
    "- originalText 尽量提取图片中的原始可见文本。",
  ].join("\n")

  const result = await createDashscopeChatCompletion({
    model: "qwen-vl-plus",
    messages: [
      {
        role: "system",
        content: "你是一个严谨的病历图片信息提取助手，只返回 JSON。",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
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

  const parsed = JSON.parse(extractJsonBlock(result)) as unknown
  return extractedMedicalRecordSchema.parse(parsed)
}
