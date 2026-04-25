import { z } from "zod"

import { createDashscopeChatCompletion } from "@/lib/ai/dashscope"

const extractedMedicineSchema = z.object({
  name: z.string().trim().default(""),
  category: z.string().trim().default(""),
  dosage: z.string().trim().default(""),
  specification: z.string().trim().default(""),
  instructions: z.string().trim().default(""),
  purpose: z.string().trim().default(""),
  aiSummary: z.string().trim().default(""),
  warnings: z.array(z.string().trim()).default([]),
})

export type ExtractedMedicineData = z.infer<typeof extractedMedicineSchema>

function extractJsonBlock(text: string) {
  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 没有返回可解析的结构化结果。")
  }

  return text.slice(start, end + 1)
}

export async function extractMedicineFromImage(dataUrl: string) {
  const prompt = [
    "你是一个用于家庭药品资料整理的视觉识别助手。",
    "请只根据图片中的药盒、标签或说明书原文提取信息，不要臆测。",
    "如果看不清，请返回空字符串，不要编造。",
    "请严格返回 JSON，不要输出额外说明。",
    "JSON 字段必须包含：",
    "name, category, dosage, specification, instructions, purpose, aiSummary, warnings",
    "其中：",
    "- category 使用简短中文分类，如：抗感染、止痛退烧、抗过敏、感冒对症、营养补充、设备耗材。",
    "- purpose 表示治疗疾病或适应症，用简短中文说明。",
    "- instructions 表示使用说明，尽量提取原文核心信息。",
    "- aiSummary 说明你主要从图片里识别到了什么，哪些字段可信，哪些字段不清晰。",
    "- warnings 是字符串数组，用来列出低置信度提醒。",
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
