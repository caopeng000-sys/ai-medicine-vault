import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { rebuildIndex } from "@/features/medicine-vault/health-chunk-index-service"

export async function POST() {
  try {
    const ctx = await requireCurrentUser()
    const result = await rebuildIndex(ctx)
    return NextResponse.json({ message: "健康资料向量索引已重建。", data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : "重建健康资料索引失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
