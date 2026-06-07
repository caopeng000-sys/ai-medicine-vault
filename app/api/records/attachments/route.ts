import { NextResponse } from "next/server"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { parseMedicalAttachmentSubmission } from "@/features/medicine-vault/medical-attachment-request"
import { createMedicalRecordAttachment } from "@/features/medicine-vault/repository"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const { input, file } = await parseMedicalAttachmentSubmission(request)
    const attachment = await createMedicalRecordAttachment(ctx, input, file)
    return NextResponse.json({ message: "病历附件已保存。", data: attachment })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "保存病历附件失败。" }, { status: 400 })
  }
}
