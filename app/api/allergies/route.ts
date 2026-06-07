import { NextResponse } from "next/server"

import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { createAllergyRecord } from "@/features/medicine-vault/repository"
import { createAllergyRecordSchema } from "@/features/medicine-vault/schemas"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = createAllergyRecordSchema.parse(await request.json())
    const record = await createAllergyRecord(ctx, input)

    return NextResponse.json({
      message: "过敏记录已写入数据库。",
      data: record,
    })
  } catch (error) {
    return toApiErrorResponse(error, "创建过敏记录失败。")
  }
}
