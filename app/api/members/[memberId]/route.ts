import { NextResponse } from "next/server"

import { NotFoundError, toApiErrorResponse } from "@/features/medicine-vault/api-errors"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { deleteMember, getMemberById, updateMember } from "@/features/medicine-vault/repository"
import { updateMemberSchema } from "@/features/medicine-vault/schemas"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { memberId } = await context.params
    const existingMember = await getMemberById(ctx, memberId)

    if (!existingMember) {
      throw new NotFoundError("成员不存在。")
    }

    const input = updateMemberSchema.parse(await request.json())
    const member = await updateMember(ctx, memberId, input)

    return NextResponse.json({
      message: "成员信息已更新。",
      data: member,
    })
  } catch (error) {
    return toApiErrorResponse(error, "更新成员失败。")
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const ctx = await requireCurrentUser()
    const { memberId } = await context.params
    const existingMember = await getMemberById(ctx, memberId)

    if (!existingMember) {
      throw new NotFoundError("成员不存在。")
    }

    const member = await deleteMember(ctx, memberId)

    return NextResponse.json({
      message: `已删除成员“${member.name}”及其关联记录。`,
      data: member,
    })
  } catch (error) {
    return toApiErrorResponse(error, "删除成员失败。")
  }
}
