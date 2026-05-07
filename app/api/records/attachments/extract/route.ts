import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { errorResponse, rateLimitError, upstreamAiError, validationError } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import {
  extractMedicalRecordAttachmentFromImage,
  type MedicalRecordAttachmentExtraction,
} from "@/features/medicine-vault/medical-record-attachment-extractor"
import { logAiCall, type AiCallLogInput } from "@/features/medicine-vault/repository"
import { medicineExtractRateLimiter, type MemoryRateLimiter } from "@/features/medicine-vault/rate-limit"

const MAX_FILE_SIZE = 8 * 1024 * 1024

type ExtractAttachmentFromImage = (dataUrl: string) => Promise<MedicalRecordAttachmentExtraction>
type LogAiCall = (ctx: RepositoryContext, input: AiCallLogInput) => Promise<void>

function isImageFile(file: File) {
  return file.type.startsWith("image/")
}

function toDataUrl(file: File, buffer: Buffer) {
  const mimeType = file.type || "image/jpeg"
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export function createMedicalRecordAttachmentExtractHandler(
  extractImage: ExtractAttachmentFromImage = extractMedicalRecordAttachmentFromImage,
  getContext = requireCurrentUser,
  options: Partial<{
    rateLimiter: MemoryRateLimiter
    logAiCall: LogAiCall
  }> = {}
) {
  const rateLimiter = options.rateLimiter ?? medicineExtractRateLimiter
  const writeAiCallLog = options.logAiCall ?? logAiCall

  return async function POST(request: Request) {
    let ctx: RepositoryContext | undefined
    let inputBytes = 0

    try {
      ctx = await getContext()
      const rateLimit = rateLimiter.check(ctx.userId, "records.attachments.extract")

      if (!rateLimit.allowed) {
        await writeAiCallLog(ctx, {
          routeKey: "records.attachments.extract",
          provider: "dashscope",
          model: "qwen-vl-plus",
          status: "rate_limited",
        })
        return rateLimitError(rateLimit.retryAfterSeconds)
      }

      const formData = await request.formData()
      const file = formData.get("file")

      if (!(file instanceof File)) {
        return validationError("请先上传病历附件图片。")
      }

      inputBytes = file.size

      if (!isImageFile(file)) {
        return validationError("当前 AI 摘要仅支持图片附件，PDF 请先保存归档。")
      }

      if (file.size > MAX_FILE_SIZE) {
        return validationError("附件图片不能超过 8MB。")
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const extracted = await extractImage(toDataUrl(file, buffer))

      await writeAiCallLog(ctx, {
        routeKey: "records.attachments.extract",
        provider: "dashscope",
        model: "qwen-vl-plus",
        status: extracted.warnings.length ? "fallback" : "success",
        inputBytes,
        outputBytes: new TextEncoder().encode(JSON.stringify(extracted)).length,
      })

      return NextResponse.json({
        message: "病历附件识别完成。",
        data: extracted,
      })
    } catch (error) {
      if (!ctx) {
        return errorResponse(error, "病历附件识别失败。")
      }

      await writeAiCallLog(ctx, {
        routeKey: "records.attachments.extract",
        provider: "dashscope",
        model: "qwen-vl-plus",
        status: "error",
        inputBytes,
        errorMessage: error instanceof Error ? error.message : "unknown",
      })

      return upstreamAiError("病历附件识别服务暂时不可用，请稍后再试。")
    }
  }
}

export const POST = createMedicalRecordAttachmentExtractHandler()
