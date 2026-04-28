import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { createMedicine } from "@/features/medicine-vault/repository"
import { parseMedicineSubmission } from "@/features/medicine-vault/medicine-request"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const { input, image } = await parseMedicineSubmission(request)
    const medicine = await createMedicine(ctx, input, image)

    return NextResponse.json({
      message: "药品记录已写入数据库。",
      data: medicine,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建药品记录失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
