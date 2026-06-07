import { NextResponse } from "next/server"

import { withAiCallLogging } from "@/features/medicine-vault/ai-call-logger"
import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { generateVisitPreparationSchema } from "@/features/medicine-vault/schemas"
import { generateVisitPreparation } from "@/features/medicine-vault/visit-preparation-service"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = generateVisitPreparationSchema.parse(await request.json())
    const preparation = await withAiCallLogging(
      {
        userId: ctx.userId,
        route: "/api/visit-prep/generate",
      },
      async () => generateVisitPreparation(ctx, input),
    )

    return NextResponse.json({
      message: "就医准备清单已生成。",
      data: preparation,
    })
  } catch (error) {
    return toApiErrorResponse(error, "生成就医准备清单失败。")
  }
}
