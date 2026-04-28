import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { createMedicalRecord } from "@/features/medicine-vault/repository"
import { createMedicalRecordSchema } from "@/features/medicine-vault/schemas"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = createMedicalRecordSchema.parse(await request.json())
    const record = await createMedicalRecord(ctx, input)

    return NextResponse.json({
      message: "病历记录已写入数据库。",
      data: record,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建病历失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
