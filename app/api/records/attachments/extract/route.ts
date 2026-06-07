import { NextResponse } from "next/server"
import { extractMedicalAttachmentFromImage } from "@/features/medicine-vault/medical-attachment-extractor"

const MAX_FILE_SIZE = 8 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image")
    if (!(file instanceof File)) throw new Error("请先上传报告图片。")
    if (!file.type.startsWith("image/")) throw new Error("当前只支持上传图片文件。")
    if (file.size > MAX_FILE_SIZE) throw new Error("图片不能超过 8MB。")
    const buffer = Buffer.from(await file.arrayBuffer())
    const extracted = await extractMedicalAttachmentFromImage(`data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`)
    return NextResponse.json({
      message: "报告图片识别完成。",
      data: { extractedText: extracted.extractedText, suggestedMetadata: { visitedAt: extracted.visitedAt, hospital: extracted.hospital, diagnosis: extracted.diagnosis, reportType: extracted.reportType, summary: extracted.summary, warnings: extracted.warnings } },
    })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "报告图片识别失败。" }, { status: 400 })
  }
}
