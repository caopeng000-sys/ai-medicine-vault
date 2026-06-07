import { NextResponse } from "next/server"

import { withAiCallLogging } from "@/features/medicine-vault/ai-call-logger"
import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { crossCheckMedicineForMember } from "@/features/medicine-vault/allergy-cross-check"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { extractMedicineFromImage } from "@/features/medicine-vault/medicine-image-extractor"
import { aiImageExtractRateLimiter, rateLimitResponse } from "@/features/medicine-vault/rate-limiter"
import { listAllergyRecords } from "@/features/medicine-vault/repository"
import { assertValidImageUpload } from "@/features/medicine-vault/upload-validation"

function toDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "image/jpeg"
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const rateLimit = aiImageExtractRateLimiter.checkRateLimit(ctx.userId)

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds)
    }

    const formData = await request.formData()
    const file = formData.get("image")
    const memberIdValue = formData.get("memberId")
    const memberId = typeof memberIdValue === "string" ? memberIdValue.trim() : ""

    if (!(file instanceof File)) {
      throw new Error("请先上传药品图片。")
    }

    assertValidImageUpload(file)

    const buffer = Buffer.from(await file.arrayBuffer())
    const extracted = await withAiCallLogging(
      {
        userId: ctx.userId,
        route: "/api/medicines/extract",
      },
      async () => extractMedicineFromImage(toDataUrl(file, buffer)),
    )

    let allergyCrossCheck = null

    if (memberId) {
      const allergies = await listAllergyRecords(ctx, memberId)
      allergyCrossCheck = crossCheckMedicineForMember(memberId, extracted, allergies)
    }

    return NextResponse.json({
      message: "图片识别完成。",
      data: extracted,
      allergyCrossCheck,
    })
  } catch (error) {
    return toApiErrorResponse(error, "图片识别失败。")
  }
}
