import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, rateLimitError, upstreamAiError, validationError } from "@/features/medicine-vault/api-errors"
import { extractMedicineFromImage } from "@/features/medicine-vault/medicine-image-extractor"
import { logAiCall, type AiCallLogInput } from "@/features/medicine-vault/repository"
import { medicineExtractRateLimiter, type MemoryRateLimiter } from "@/features/medicine-vault/rate-limit"
import type { ExtractedMedicineData } from "@/features/medicine-vault/schemas"

const MAX_FILE_SIZE = 8 * 1024 * 1024

type ExtractMedicineFromImage = (dataUrl: string) => Promise<ExtractedMedicineData>
type LogAiCall = (ctx: RepositoryContext, input: AiCallLogInput) => Promise<void>

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}

function toDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "image/jpeg"
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export function createMedicineExtractHandler(
  extractImage: ExtractMedicineFromImage = extractMedicineFromImage,
  getContext = requireCurrentUser,
  options: Partial<{
    rateLimiter: MemoryRateLimiter
    logAiCall: LogAiCall
  }> = {},
) {
  const rateLimiter = options.rateLimiter ?? medicineExtractRateLimiter
  const writeAiCallLog = options.logAiCall ?? logAiCall

  return async function POST(request: Request) {
    let ctx: RepositoryContext | undefined
    let inputBytes = 0

    try {
      ctx = await getContext()
      const rateLimit = rateLimiter.check(ctx.userId, "medicines.extract")

      if (!rateLimit.allowed) {
        await writeAiCallLog(ctx, {
          routeKey: "medicines.extract",
          provider: "dashscope",
          model: "qwen-vl-plus",
          status: "rate_limited",
        })
        return rateLimitError(rateLimit.retryAfterSeconds)
      }

      const formData = await request.formData()
      const file = formData.get("image")

      if (!(file instanceof File)) {
        return validationError("请先上传药品图片。")
      }

      inputBytes = file.size

      if (!isImageFile(file)) {
        return validationError("当前只支持上传图片文件。")
      }

      if (file.size > MAX_FILE_SIZE) {
        return validationError("图片不能超过 8MB。")
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const extracted = await extractImage(toDataUrl(file, buffer))

      await writeAiCallLog(ctx, {
        routeKey: "medicines.extract",
        provider: "dashscope",
        model: "qwen-vl-plus",
        status: extracted.warnings.length ? "fallback" : "success",
        inputBytes,
        outputBytes: new TextEncoder().encode(JSON.stringify(extracted)).length,
      })

      return NextResponse.json({
        message: "图片识别完成。",
        data: extracted,
      })
    } catch (error) {
      if (!ctx) {
        return errorResponse(error, "图片识别失败。")
      }

      await writeAiCallLog(ctx, {
        routeKey: "medicines.extract",
        provider: "dashscope",
        model: "qwen-vl-plus",
        status: "error",
        inputBytes,
        errorMessage: error instanceof Error ? error.message : "unknown",
      })

      return upstreamAiError("图片识别服务暂时不可用，请稍后再试。")
    }
  }
}

export const POST = createMedicineExtractHandler()
