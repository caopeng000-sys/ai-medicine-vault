import { NextResponse } from "next/server"

import { withAiCallLogging } from "@/features/medicine-vault/ai-call-logger"
import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { extractMedicalRecordFromImage } from "@/features/medicine-vault/medical-record-extractor"
import { aiImageExtractRateLimiter, rateLimitResponse } from "@/features/medicine-vault/rate-limiter"
import { assertValidImageUpload } from "@/features/medicine-vault/upload-validation"

function toDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "image/jpeg"
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const rateLimit = aiImageExtractRateLimiter.checkRateLimit(`record:${ctx.userId}`)

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds)
    }

    const formData = await request.formData()
    const file = formData.get("image")

    if (!(file instanceof File)) {
      throw new Error("请先上传病历图片。")
    }

    assertValidImageUpload(file)

    const buffer = Buffer.from(await file.arrayBuffer())
    const extracted = await withAiCallLogging(
      {
        userId: ctx.userId,
        route: "/api/records/extract",
      },
      async () => extractMedicalRecordFromImage(toDataUrl(file, buffer)),
    )

    return NextResponse.json({
      message: "病历图片识别完成。",
      data: extracted,
    })
  } catch (error) {
    return toApiErrorResponse(error, "病历图片识别失败。")
  }
}
