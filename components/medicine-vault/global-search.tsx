"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState } from "react"
import { LoaderCircleIcon, SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Member } from "@/features/medicine-vault/data"
import type { SearchResultItem, VaultSearchResponse } from "@/features/medicine-vault/search-service"
import { cn } from "@/lib/utils"

const categoryLabels = {
  member: "成员",
  record: "病历",
  medicine: "药品",
  allergy: "过敏",
} as const

export function GlobalSearch() {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<VaultSearchResponse | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [memberId, setMemberId] = useState("")
  useEffect(() => { void fetch("/api/members").then((r) => r.json()).then((p) => setMembers(p.members ?? [])).catch(() => setMembers([])) }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [])

  async function handleSearch(nextQuery = query) {
    const trimmedQuery = nextQuery.trim()

    if (!trimmedQuery) {
      setError("请输入搜索关键词。")
      setResult(null)
      setOpen(false)
      return
    }

    setLoading(true)
    setError("")
    setOpen(true)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: trimmedQuery, ...(memberId ? { memberId } : {}) }),
      })

      const payload = (await response.json()) as VaultSearchResponse & { message?: string }

      if (!response.ok) {
        throw new Error(payload.message ?? "搜索失败。")
      }

      setResult(payload)
    } catch (searchError) {
      setResult(null)
      setError(searchError instanceof Error ? searchError.message : "搜索失败。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-w-0 flex-1" ref={containerRef}>
      <form
        className="flex min-w-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          void handleSearch()
        }}
      >
        {members.length > 0 ? <select aria-label="成员筛选" className="h-9 shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs lg:max-w-[8.5rem]" onChange={(e) => setMemberId(e.target.value)} value={memberId}><option value="">全部成员</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select> : null}<SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
        <Input
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索药品、病历、成员或就医问题..."
          role="combobox"
          value={query}
        />
        {loading ? <LoaderCircleIcon className="size-4 animate-spin text-slate-400" aria-hidden="true" /> : null}
      </form>

      {open ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]"
          id={listboxId}
          role="listbox"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-900">搜索结果</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{result?.summary ?? error ?? "正在搜索..."}</p>
          </div>

          {result && result.results.length > 0 ? (
            <ul className="max-h-[420px] overflow-y-auto p-2">
              {result.results.map((item) => (
                <SearchResultRow item={item} key={`${item.category}-${item.id}`} onNavigate={() => setOpen(false)} />
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500">
              {loading ? "正在整理搜索结果..." : error || "没有找到匹配内容，试试换个关键词。"}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function SearchResultRow({
  item,
  onNavigate,
}: Readonly<{
  item: SearchResultItem
  onNavigate: () => void
}>) {
  return (
    <li>
      <Link
        className={cn(
          "flex items-start gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-slate-50",
        )}
        href={item.href}
        onClick={onNavigate}
        role="option"
      >
        <Badge className="mt-0.5 rounded-full px-2.5 py-1" variant="secondary">
          {categoryLabels[item.category]}
        </Badge>
        <span className="grid min-w-0 gap-1">
          <span className="truncate text-sm font-medium text-slate-900">{item.label}</span>
          <span className="truncate text-sm text-slate-500">{item.detail}</span>
        </span>
      </Link>
    </li>
  )
}
