import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, isInvalidJsonError, validationError } from "@/features/medicine-vault/api-errors"
import { deleteMedicine, getMedicineById, updateMedicine } from "@/features/medicine-vault/repository"
import { parseMedicineSubmission } from "@/features/medicine-vault/medicine-request"

type MedicineDetailDependencies = Readonly<{
  getContext: typeof requireCurrentUser
  getMedicineById: typeof getMedicineById
  updateMedicine: typeof updateMedicine
  deleteMedicine: typeof deleteMedicine
  parseMedicineSubmission: typeof parseMedicineSubmission
}>

function isMedicineOwnershipError(error: unknown) {
  return error instanceof Error && error.message.includes("不属于当前用户")
}

export function createMedicineDetailHandlers(dependencies: Partial<MedicineDetailDependencies> = {}) {
  const getContext = dependencies.getContext ?? requireCurrentUser
  const readMedicine = dependencies.getMedicineById ?? getMedicineById
  const writeMedicine = dependencies.updateMedicine ?? updateMedicine
  const removeMedicine = dependencies.deleteMedicine ?? deleteMedicine
  const readSubmission = dependencies.parseMedicineSubmission ?? parseMedicineSubmission

  return {
    async PATCH(request: Request, context: { params: Promise<{ medicineId: string }> }) {
      try {
        const ctx = await getContext()
        const { medicineId } = await context.params
        const existingMedicine = await readMedicine(ctx, medicineId)

        if (!existingMedicine) {
          return NextResponse.json({ message: "药品记录不存在。" }, { status: 404 })
        }

        const { input, image } = await readSubmission(request)
        const medicine = await writeMedicine(ctx, medicineId, input, image)

        return NextResponse.json({
          message: "药品记录已更新。",
          data: medicine,
        })
      } catch (error) {
        if (isMedicineOwnershipError(error)) {
          return validationError(error instanceof Error ? error.message : "药品记录不属于当前用户。")
        }

        if (isInvalidJsonError(error)) {
          return validationError("请求参数格式不正确。")
        }

        return errorResponse(error, "更新药品记录失败。")
      }
    },

    async DELETE(_request: Request, context: { params: Promise<{ medicineId: string }> }) {
      try {
        const ctx = await getContext()
        const { medicineId } = await context.params
        const existingMedicine = await readMedicine(ctx, medicineId)

        if (!existingMedicine) {
          return NextResponse.json({ message: "药品记录不存在。" }, { status: 404 })
        }

        const medicine = await removeMedicine(ctx, medicineId)

        return NextResponse.json({
          message: `已删除药品“${medicine.name}”。`,
          data: medicine,
        })
      } catch (error) {
        if (isMedicineOwnershipError(error)) {
          return validationError(error instanceof Error ? error.message : "药品记录不属于当前用户。")
        }

        return errorResponse(error, "删除药品记录失败。")
      }
    },
  }
}

export const { PATCH, DELETE } = createMedicineDetailHandlers()
