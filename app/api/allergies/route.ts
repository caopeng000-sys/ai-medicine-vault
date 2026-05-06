import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import { createAllergyRecord } from "@/features/medicine-vault/repository"
import type { CreateAllergyRecordInput } from "@/features/medicine-vault/schemas"
import { createAllergyRecordSchema } from "@/features/medicine-vault/schemas"

type CreateAllergyRecord = (ctx: RepositoryContext, input: CreateAllergyRecordInput) => Promise<unknown>

function isBusinessValidationError(error: unknown) {
  return error instanceof Error && error.message.includes("成员不存在或不属于当前用户")
}

export function createAllergiesHandler(
  writeRecord: CreateAllergyRecord = createAllergyRecord,
  getContext = requireCurrentUser,
) {
  return async function POST(request: Request) {
    try {
      const ctx = await getContext()
      const input = createAllergyRecordSchema.parse(await request.json())
      const record = await writeRecord(ctx, input)

      return NextResponse.json({
        message: "过敏记录已写入数据库。",
        data: record,
      })
    } catch (error) {
      if (isBusinessValidationError(error) && error instanceof Error) {
        return validationError(error.message)
      }

      return errorResponse(error, "创建过敏记录失败。")
    }
  }
}

export const POST = createAllergiesHandler()
