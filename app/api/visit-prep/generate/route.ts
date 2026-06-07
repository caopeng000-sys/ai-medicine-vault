import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { generateVisitPreparationSchema } from "@/features/medicine-vault/schemas"
import { generateVisitPreparation } from "@/features/medicine-vault/visit-preparation-service"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = generateVisitPreparationSchema.parse(await request.json())
    const preparation = await generateVisitPreparation(ctx, input)

    return NextResponse.json({
      message: "就医准备清单已生成。",
      data: preparation,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成就医准备清单失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
