import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, validationError } from "@/features/medicine-vault/api-errors"
import type { MedicineImageAttachment } from "@/features/medicine-vault/medicine-request"
import { createMedicine } from "@/features/medicine-vault/repository"
import type { CreateMedicineInput } from "@/features/medicine-vault/schemas"
import { parseMedicineSubmission } from "@/features/medicine-vault/medicine-request"

type CreateMedicine = (
  ctx: RepositoryContext,
  input: CreateMedicineInput,
  image?: MedicineImageAttachment,
) => Promise<unknown>

function isBusinessValidationError(error: unknown) {
  if (!(error instanceof Error)) return false

  return (
    error.message.includes("成员不存在或不属于当前用户") ||
    error.message.toLowerCase().includes("json")
  )
}

export function createMedicinesHandler(
  writeMedicine: CreateMedicine = createMedicine,
  getContext = requireCurrentUser,
) {
  return async function POST(request: Request) {
    try {
      const ctx = await getContext()
      const { input, image } = await parseMedicineSubmission(request)
      const medicine = await writeMedicine(ctx, input, image)

      return NextResponse.json({
        message: "药品记录已写入数据库。",
        data: medicine,
      })
    } catch (error) {
      if (isBusinessValidationError(error) && error instanceof Error) {
        return validationError(
          error.message.toLowerCase().includes("json") ? "请求参数格式不正确。" : error.message,
        )
      }

      return errorResponse(error, "创建药品记录失败。")
    }
  }
}

export const POST = createMedicinesHandler()
