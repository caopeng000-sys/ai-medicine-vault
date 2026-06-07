"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { LoaderCircleIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Member } from "@/features/medicine-vault/data"

type VisitPrepToolbarProps = Readonly<{
  members: Member[]
  defaultMemberId: string
  defaultConcern: string
}>

export function VisitPrepToolbar({ members, defaultMemberId, defaultConcern }: VisitPrepToolbarProps) {
  const router = useRouter()
  const [memberId, setMemberId] = useState(defaultMemberId)
  const [concern, setConcern] = useState(defaultConcern)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate() {
    if (!memberId.trim()) {
      setError("请选择成员。")
      return
    }

    if (!concern.trim()) {
      setError("请描述就医场景或关注点。")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/visit-prep/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId,
          concern: concern.trim(),
        }),
      })

      const payload = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(payload.message ?? "生成就医准备清单失败。")
      }

      router.refresh()
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "生成就医准备清单失败。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="grid flex-1 gap-2 text-sm">
          <span className="font-medium text-slate-600">成员</span>
          <select
            className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
            disabled={loading}
            onChange={(event) => setMemberId(event.target.value)}
            value={memberId}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}（{member.relationship}）
              </option>
            ))}
          </select>
        </label>

        <label className="grid flex-[1.4] gap-2 text-sm">
          <span className="font-medium text-slate-600">就医场景</span>
          <Input
            className="rounded-2xl"
            disabled={loading}
            onChange={(event) => setConcern(event.target.value)}
            placeholder="例如：咳嗽低烧复诊"
            value={concern}
          />
        </label>

        <Button
          className="rounded-2xl bg-emerald-500 px-4 text-white shadow-sm hover:bg-emerald-600"
          disabled={loading}
          onClick={handleGenerate}
          type="button"
        >
          {loading ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
          重新生成摘要
        </Button>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
