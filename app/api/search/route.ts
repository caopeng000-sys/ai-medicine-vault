import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { vaultSearchSchema } from "@/features/medicine-vault/schemas"
import { searchVault } from "@/features/medicine-vault/search-service"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = vaultSearchSchema.parse(await request.json())
    const result = await searchVault(ctx, input.query)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "搜索失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
