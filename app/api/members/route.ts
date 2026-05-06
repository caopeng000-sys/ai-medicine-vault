import { NextResponse } from "next/server"

import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse } from "@/features/medicine-vault/api-errors"
import { createMember } from "@/features/medicine-vault/repository"
import type { CreateMemberInput } from "@/features/medicine-vault/schemas"
import { createMemberSchema } from "@/features/medicine-vault/schemas"

type CreateMember = (ctx: RepositoryContext, input: CreateMemberInput) => Promise<unknown>

export function createMembersHandler(
  writeMember: CreateMember = createMember,
  getContext = requireCurrentUser,
) {
  return async function POST(request: Request) {
    try {
      const ctx = await getContext()
      const input = createMemberSchema.parse(await request.json())
      const member = await writeMember(ctx, input)

      return NextResponse.json({
        message: "成员已写入数据库。",
        data: member,
      })
    } catch (error) {
      return errorResponse(error, "创建成员失败。")
    }
  }
}

export const POST = createMembersHandler()
