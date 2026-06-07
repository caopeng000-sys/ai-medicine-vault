import { NextResponse } from "next/server"

import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { vaultSearchSchema } from "@/features/medicine-vault/schemas"
import { searchVault } from "@/features/medicine-vault/search-service"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = vaultSearchSchema.parse(await request.json())
    const result = await searchVault(ctx, input.query, {}, { memberId: input.memberId })

    return NextResponse.json(result)
  } catch (error) {
    return toApiErrorResponse(error, "搜索失败。")
  }
}
