import { NextResponse } from "next/server"

import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { createMedicalRecordAttachment } from "@/features/medicine-vault/repository"

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])

function isBusinessValidationError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("病历不存在或不属于当前用户") ||
      error.message.includes("当前还没有配置 DATABASE_URL"))
  )
}

function normalizeText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : ""
}

export async function POST(request: Request, context: { params: Promise<{ recordId: string }> }) {
  try {
    const ctx = await requireCurrentUser()
    const { recordId } = await context.params
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return validationError("请上传病历附件。")
    }

    if (!allowedMimeTypes.has(file.type)) {
      return validationError("病历附件仅支持 JPG、PNG、WebP 或 PDF。")
    }

    if (file.size <= 0) {
      return validationError("病历附件不能为空。")
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      return validationError("病历附件不能超过 8MB。")
    }

    const attachment = await createMedicalRecordAttachment(ctx, recordId, {
      fileBytes: new Uint8Array(await file.arrayBuffer()),
      fileName: file.name || "病历附件",
      mimeType: file.type,
      kind: normalizeText(formData.get("kind")) || "检查报告",
      note: normalizeText(formData.get("note")),
    })

    return NextResponse.json({
      message: "病历附件已保存。",
      data: attachment,
    })
  } catch (error) {
    if (isBusinessValidationError(error) && error instanceof Error) {
      return validationError(error.message)
    }

    return errorResponse(error, "保存病历附件失败。")
  }
}
