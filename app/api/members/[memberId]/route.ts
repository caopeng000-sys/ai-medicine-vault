import { NextResponse } from "next/server"

import { deleteMember, getMemberById, updateMember } from "@/features/medicine-vault/repository"
import { updateMemberSchema } from "@/features/medicine-vault/schemas"

export async function PATCH(
  request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await context.params
    const existingMember = await getMemberById(memberId)

    if (!existingMember) {
      return NextResponse.json({ message: "成员不存在。" }, { status: 404 })
    }

    const input = updateMemberSchema.parse(await request.json())
    const member = await updateMember(memberId, input)

    return NextResponse.json({
      message: "成员信息已更新。",
      data: member,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新成员失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await context.params
    const existingMember = await getMemberById(memberId)

    if (!existingMember) {
      return NextResponse.json({ message: "成员不存在。" }, { status: 404 })
    }

    const member = await deleteMember(memberId)

    return NextResponse.json({
      message: `已删除成员“${member.name}”及其关联记录。`,
      data: member,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除成员失败。"
    return NextResponse.json({ message }, { status: 400 })
  }
}
