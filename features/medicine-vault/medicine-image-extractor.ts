import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

import { extractedMedicineSchema, medicineExtractionFieldNames } from "./schemas"

import type { ExtractedMedicineData } from "./schemas"

export function buildMedicineExtractionPrompt() {
  return [
    "你是一个用于家庭药品资料整理的视觉识别助手。",
    "先尽量识别图片中的原文，再基于原文整理结构化字段。",
    "请返回原文、药名、规格、剂量、剂型、用法用量、治疗范围、注意事项、摘要和低置信度提醒。",
    "如果看不清，请返回空字符串，不要臆测。",
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

export async function extractMedicineFromImage(dataUrl: string): Promise<ExtractedMedicineData> {
  const prompt = [
    buildMedicineExtractionPrompt(),
    "请只根据图片中的药盒、标签或说明书原文提取信息，不要臆测。",
    "JSON 字段必须包含：",
    medicineExtractionFieldNames.join(", "),
    "其中：",
    "- category 使用简短中文分类，如：抗感染、止痛退烧、抗过敏、感冒对症、营养补充、设备耗材。",
    "- purpose 表示治疗疾病或适应症，用简短中文说明。",
    "- instructions 表示使用说明，尽量提取原文核心信息。",
    "- summary 说明你主要从图片里识别到了什么，哪些字段可信，哪些字段不清晰。",
    "- warnings 是字符串数组，用来列出低置信度提醒。",
    "- originalText 尽量提取图片中的原始可见文本。",
  ].join("\n")

  const result = await createDashscopeChatCompletion({
    model: "qwen-vl-plus",
    messages: [
      {
        role: "system",
        content: "你是一个严谨的药品图片信息提取助手，只返回 JSON。",
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
  return extractedMedicineSchema.parse(parsed)
}
