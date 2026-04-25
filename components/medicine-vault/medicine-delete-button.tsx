"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function MedicineDeleteButton({
  medicineId,
  medicineName,
  className,
}: Readonly<{
  medicineId: string
  medicineName: string
  className?: string
}>) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    const shouldDelete = window.confirm(`确认删除药品“${medicineName}”吗？删除后无法恢复。`)

    if (!shouldDelete) {
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/medicines/${medicineId}`, {
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
      className={`group h-11 rounded-full border-rose-200 bg-rose-50 px-5 text-rose-600 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-100 ${className ?? ""}`}
      disabled={isDeleting}
      onClick={handleDelete}
      type="button"
      variant="outline"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-rose-50 text-rose-500 transition-colors group-hover:bg-rose-100">
        <Trash2Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="text-rose-600">{isDeleting ? "删除中..." : "删除"}</span>
    </Button>
  )
}
