import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse } from "@/features/medicine-vault/api-errors"
import { getMedicineImageById } from "@/features/medicine-vault/repository"

type MedicineImageDependencies = Readonly<{
  getContext: typeof requireCurrentUser
  getMedicineImageById: typeof getMedicineImageById
}>

export function createMedicineImageHandler(dependencies: Partial<MedicineImageDependencies> = {}) {
  const getContext = dependencies.getContext ?? requireCurrentUser
  const readMedicineImage = dependencies.getMedicineImageById ?? getMedicineImageById

  return async function GET(_request: Request, context: { params: Promise<{ medicineId: string }> }) {
    try {
      const ctx = await getContext()
      const { medicineId } = await context.params
      const medicineImage = await readMedicineImage(ctx, medicineId)

      if (!medicineImage) {
        return NextResponse.json({ message: "未找到药品原图。" }, { status: 404 })
      }

      const safeFileName = medicineImage.imageName
        .replaceAll('"', "'")
        .replace(/[^\x20-\x7E]/g, "_")
      const encodedFileName = encodeURIComponent(medicineImage.imageName)

      return new Response(Buffer.from(medicineImage.imageBytes), {
        headers: {
          "Content-Type": medicineImage.imageMimeType,
          "Content-Disposition": `inline; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`,
          "X-Content-Type-Options": "nosniff",
        },
      })
    } catch (error) {
      return errorResponse(error, "获取药品原图失败。")
    }
  }
}

export const GET = createMedicineImageHandler()
