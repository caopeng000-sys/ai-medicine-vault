"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function RecordAttachmentDeleteButton({
  recordId,
  attachmentId,
  fileName,
}: Readonly<{
  recordId: string
  attachmentId: string
  fileName: string
}>) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    const shouldDelete = window.confirm(`确认删除附件“${fileName}”吗？删除后无法恢复。`)

    if (!shouldDelete) return

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/records/${recordId}/attachments/${attachmentId}`, {
        method: "DELETE",
      })
      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message ?? "删除失败。")
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
      className="size-8 rounded-full border-rose-100 bg-rose-50 text-rose-600 hover:border-rose-200 hover:bg-rose-100"
      disabled={isDeleting}
      onClick={handleDelete}
      size="icon"
      type="button"
      variant="outline"
    >
      <Trash2Icon className="size-4" aria-hidden="true" />
      <span className="sr-only">{isDeleting ? "删除中" : "删除附件"}</span>
    </Button>
  )
}
