import { NextResponse } from "next/server"

import { createMedicine } from "@/features/medicine-vault/repository"
import { createMedicineSchema } from "@/features/medicine-vault/schemas"

export async function POST(request: Request) {
  try {
    const input = createMedicineSchema.parse(await request.json())
    const medicine = await createMedicine(input)

    return NextResponse.json({
      message: "药品记录已写入数据库。",
      data: medicine,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建药品记录失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
