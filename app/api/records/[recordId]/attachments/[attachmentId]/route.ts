import { errorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import {
  deleteMedicalRecordAttachmentById,
  getMedicalRecordAttachmentById,
} from "@/features/medicine-vault/repository"

export async function GET(
  _request: Request,
  context: { params: Promise<{ recordId: string; attachmentId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { recordId, attachmentId } = await context.params
    const attachment = await getMedicalRecordAttachmentById(ctx, recordId, attachmentId)

    if (!attachment) {
      return Response.json({ message: "未找到病历附件。" }, { status: 404 })
    }

    const safeFileName = attachment.fileName.replaceAll('"', "'").replace(/[^\x20-\x7E]/g, "_")
    const encodedFileName = encodeURIComponent(attachment.fileName)

    return new Response(Buffer.from(attachment.fileBytes), {
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    return errorResponse(error, "获取病历附件失败。")
  }
}

function isBusinessValidationError(error: unknown) {
  return error instanceof Error && error.message.includes("病历附件不存在或不属于当前用户")
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ recordId: string; attachmentId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { recordId, attachmentId } = await context.params
    const attachment = await deleteMedicalRecordAttachmentById(ctx, recordId, attachmentId)

    return Response.json({
      message: "病历附件已删除。",
      data: attachment,
    })
  } catch (error) {
    if (isBusinessValidationError(error) && error instanceof Error) {
      return Response.json({ message: error.message }, { status: 400 })
    }

    return errorResponse(error, "删除病历附件失败。")
  }
}
