import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import { createMedicalRecord } from "@/features/medicine-vault/repository"
import type { CreateMedicalRecordInput } from "@/features/medicine-vault/schemas"
import { createMedicalRecordSchema } from "@/features/medicine-vault/schemas"

type CreateMedicalRecord = (ctx: RepositoryContext, input: CreateMedicalRecordInput) => Promise<unknown>

function isBusinessValidationError(error: unknown) {
  return error instanceof Error && error.message.includes("成员不存在或不属于当前用户")
}

export function createRecordsHandler(
  writeRecord: CreateMedicalRecord = createMedicalRecord,
  getContext = requireCurrentUser,
) {
  return async function POST(request: Request) {
    try {
      const ctx = await getContext()
      const input = createMedicalRecordSchema.parse(await request.json())
      const record = await writeRecord(ctx, input)

      return NextResponse.json({
        message: "病历记录已写入数据库。",
        data: record,
      })
    } catch (error) {
      if (isBusinessValidationError(error) && error instanceof Error) {
        return validationError(error.message)
      }

      return errorResponse(error, "创建病历失败。")
    }
  }
}

export const POST = createRecordsHandler()
