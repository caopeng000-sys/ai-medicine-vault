import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { createMemberSchema } from "@/features/medicine-vault/schemas"
import { createMember } from "@/features/medicine-vault/repository"

export async function POST(request: Request) {
  try {
    const ctx = await requireCurrentUser()
    const input = createMemberSchema.parse(await request.json())
    const member = await createMember(ctx, input)

    return NextResponse.json({
      message: "成员已写入数据库。",
      data: member,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建成员失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
