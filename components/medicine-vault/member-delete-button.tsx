"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function MemberDeleteButton({
  memberId,
  memberName,
  redirectToMembers = false,
  className,
}: Readonly<{
  memberId: string
  memberName: string
  redirectToMembers?: boolean
  className?: string
}>) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    const shouldDelete = window.confirm(
      `确认删除成员“${memberName}”吗？这会同时删除关联的病历、药品、过敏和就医准备记录。`
    )

    if (!shouldDelete) {
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      })
      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message ?? "删除失败。")
      }

      if (redirectToMembers) {
        router.push("/members")
      }

      router.refresh()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除失败。")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      className={className}
      disabled={isDeleting}
      onClick={handleDelete}
      type="button"
      variant="destructive"
    >
      {isDeleting ? "删除中..." : "删除"}
    </Button>
  )
}
