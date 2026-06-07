import { NextResponse } from "next/server"

import { NotFoundError, toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { getMedicineImageById } from "@/features/medicine-vault/repository"

export async function GET(
  _request: Request,
  context: { params: Promise<{ medicineId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { medicineId } = await context.params
    const medicineImage = await getMedicineImageById(ctx, medicineId)

    if (!medicineImage) {
      throw new NotFoundError("未找到药品原图。")
    }

    const safeFileName = medicineImage.imageName
      .replaceAll('"', "'")
      .replace(/[^\x20-\x7E]/g, "_")
    const encodedFileName = encodeURIComponent(medicineImage.imageName)

    return new Response(medicineImage.imageBytes, {
      headers: {
        "Content-Type": medicineImage.imageMimeType,
        "Content-Disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    if (error instanceof NotFoundError) {
      return toApiErrorResponse(error, "未找到药品原图。")
    }

    return toApiErrorResponse(error, "读取药品图片失败。")
  }
}
