import { NextResponse } from "next/server"

import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { errorResponse, isInvalidJsonError, validationError } from "@/features/medicine-vault/api-errors"
import { deleteMember, getMemberById, updateMember } from "@/features/medicine-vault/repository"
import { updateMemberSchema } from "@/features/medicine-vault/schemas"

type MemberDetailDependencies = Readonly<{
  getContext: typeof requireCurrentUser
  getMemberById: typeof getMemberById
  updateMember: typeof updateMember
  deleteMember: typeof deleteMember
}>

function isMemberOwnershipError(error: unknown) {
  return error instanceof Error && error.message.includes("成员不存在或不属于当前用户")
}

export function createMemberDetailHandlers(dependencies: Partial<MemberDetailDependencies> = {}) {
  const getContext = dependencies.getContext ?? requireCurrentUser
  const readMember = dependencies.getMemberById ?? getMemberById
  const writeMember = dependencies.updateMember ?? updateMember
  const removeMember = dependencies.deleteMember ?? deleteMember

  return {
    async PATCH(request: Request, context: { params: Promise<{ memberId: string }> }) {
      try {
        const ctx = await getContext()
        const { memberId } = await context.params
        const existingMember = await readMember(ctx, memberId)

        if (!existingMember) {
          return NextResponse.json({ message: "成员不存在。" }, { status: 404 })
        }

        const input = updateMemberSchema.parse(await request.json())
        const member = await writeMember(ctx, memberId, input)

        return NextResponse.json({
          message: "成员信息已更新。",
          data: member,
        })
      } catch (error) {
        if (isMemberOwnershipError(error)) {
          return validationError(error instanceof Error ? error.message : "成员不存在或不属于当前用户。")
        }

        if (isInvalidJsonError(error)) {
          return validationError("请求参数格式不正确。")
        }

        return errorResponse(error, "更新成员失败。")
      }
    },

    async DELETE(_request: Request, context: { params: Promise<{ memberId: string }> }) {
      try {
        const ctx = await getContext()
        const { memberId } = await context.params
        const existingMember = await readMember(ctx, memberId)

        if (!existingMember) {
          return NextResponse.json({ message: "成员不存在。" }, { status: 404 })
        }

        const member = await removeMember(ctx, memberId)

        return NextResponse.json({
          message: `已删除成员“${member.name}”及其关联记录。`,
          data: member,
        })
      } catch (error) {
        if (isMemberOwnershipError(error)) {
          return validationError(error instanceof Error ? error.message : "成员不存在或不属于当前用户。")
        }

        return errorResponse(error, "删除成员失败。")
      }
    },
  }
}

export const { PATCH, DELETE } = createMemberDetailHandlers()
