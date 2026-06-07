import { NextResponse } from "next/server"

import { withAiCallLogging } from "@/features/medicine-vault/ai-call-logger"
import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { generateMemberHealthSummary } from "@/features/medicine-vault/member-health-summary-service"

export async function POST(
  _request: Request,
  context: Readonly<{ params: Promise<{ memberId: string }> }>,
) {
  try {
    const ctx = await requireCurrentUser()
    const { memberId } = await context.params
    const summary = await withAiCallLogging(
      {
        userId: ctx.userId,
        route: "/api/members/[memberId]/health-summary",
      },
      async () => generateMemberHealthSummary(ctx, memberId),
    )

    return NextResponse.json({
      message: "成员健康摘要已生成。",
      data: summary,
    })
  } catch (error) {
    return toApiErrorResponse(error, "生成成员健康摘要失败。")
  }
}
