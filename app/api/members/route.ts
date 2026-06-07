import { NextResponse } from "next/server"

import { toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { createMemberSchema } from "@/features/medicine-vault/schemas"
import { createMember, listMembers } from "@/features/medicine-vault/repository"

export async function GET() {
  try {
    const ctx = await requireCurrentUser()
    return NextResponse.json({ members: await listMembers(ctx) })
  } catch (error) {
    return toApiErrorResponse(error, "读取成员列表失败。")
  }
}

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
    return toApiErrorResponse(error, "创建成员失败。")
  }
}
