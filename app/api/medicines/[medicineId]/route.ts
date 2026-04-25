import { NextResponse } from "next/server"

import { deleteMedicine, getMedicineById, updateMedicine } from "@/features/medicine-vault/repository"
import { createMedicineSchema } from "@/features/medicine-vault/schemas"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ medicineId: string }> }
) {
  try {
    const { medicineId } = await context.params
    const existingMedicine = await getMedicineById(medicineId)

    if (!existingMedicine) {
      return NextResponse.json({ message: "药品记录不存在。" }, { status: 404 })
    }

    const input = createMedicineSchema.parse(await request.json())
    const medicine = await updateMedicine(medicineId, input)

    return NextResponse.json({
      message: "药品记录已更新。",
      data: medicine,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新药品记录失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ medicineId: string }> }
) {
  try {
    const { medicineId } = await context.params
    const existingMedicine = await getMedicineById(medicineId)

    if (!existingMedicine) {
      return NextResponse.json({ message: "药品记录不存在。" }, { status: 404 })
    }

    const medicine = await deleteMedicine(medicineId)

    return NextResponse.json({
      message: `已删除药品“${medicine.name}”。`,
      data: medicine,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除药品记录失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
