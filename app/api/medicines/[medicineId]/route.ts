import { NextResponse } from "next/server"

import { NotFoundError, toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { deleteMedicine, getMedicineById, updateMedicine } from "@/features/medicine-vault/repository"
import { parseMedicineSubmission } from "@/features/medicine-vault/medicine-request"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ medicineId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { medicineId } = await context.params
    const existingMedicine = await getMedicineById(ctx, medicineId)

    if (!existingMedicine) {
      throw new NotFoundError("药品记录不存在。")
    }

    const { input, image } = await parseMedicineSubmission(request)
    const medicine = await updateMedicine(ctx, medicineId, input, image)

    return NextResponse.json({
      message: "药品记录已更新。",
      data: medicine,
    })
  } catch (error) {
    return toApiErrorResponse(error, "更新药品记录失败。")
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ medicineId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { medicineId } = await context.params
    const existingMedicine = await getMedicineById(ctx, medicineId)

    if (!existingMedicine) {
      throw new NotFoundError("药品记录不存在。")
    }

    const medicine = await deleteMedicine(ctx, medicineId)

    return NextResponse.json({
      message: `已删除药品“${medicine.name}”。`,
      data: medicine,
    })
  } catch (error) {
    return toApiErrorResponse(error, "删除药品记录失败。")
  }
}
