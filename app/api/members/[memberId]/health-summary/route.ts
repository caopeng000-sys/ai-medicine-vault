import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { generateMemberHealthSummary } from "@/features/medicine-vault/member-health-summary-service"

export async function POST(
  _request: Request,
  context: Readonly<{ params: Promise<{ memberId: string }> }>,
) {
  try {
    const ctx = await requireCurrentUser()
    const { memberId } = await context.params
    const summary = await generateMemberHealthSummary(ctx, memberId)

    return NextResponse.json({
      message: "成员健康摘要已生成。",
      data: summary,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成成员健康摘要失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
