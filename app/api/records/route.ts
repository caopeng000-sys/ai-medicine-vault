import { NextResponse } from "next/server"

import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
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
    return toApiErrorResponse(error, "创建病历失败。")
  }
}
