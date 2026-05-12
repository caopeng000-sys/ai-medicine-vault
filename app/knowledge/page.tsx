"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { BookOpenTextIcon, PlusIcon, RefreshCwIcon, Trash2Icon, LibraryBigIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { KnowledgeDocumentWithChunks } from "@/features/medicine-vault/repository"

type KnowledgeDocumentView = KnowledgeDocumentWithChunks & Readonly<{
  preview: string
  chunkCount: number
}>

export type KnowledgePageModel = Readonly<{
  documents: KnowledgeDocumentView[]
  totalDocuments: number
  totalCategories: number
  latestUpdatedAt?: string
}>

function buildPreview(document: KnowledgeDocumentWithChunks) {
  const chunkPreview = document.chunks
    .map((chunk) => chunk.content.trim())
    .filter((chunk) => chunk.length > 0)
    .join(" ")

  const source = chunkPreview || document.content
  return source.length > 140 ? `${source.slice(0, 140)}…` : source
}

export function buildKnowledgePageModel(documents: KnowledgeDocumentWithChunks[]): KnowledgePageModel {
  const orderedDocuments = [...documents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  const totalCategories = new Set(orderedDocuments.map((item) => item.category).filter(Boolean)).size

  return {
    documents: orderedDocuments.map((document) => ({
      ...document,
      preview: buildPreview(document),
      chunkCount: document.chunks.length,
    })),
    totalDocuments: orderedDocuments.length,
    totalCategories,
    latestUpdatedAt: orderedDocuments[0]?.updatedAt,
  }
}

async function fetchKnowledgeDocuments() {
  const response = await fetch("/api/knowledge", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  const payload = (await response.json()) as { data?: KnowledgeDocumentWithChunks[]; message?: string }

  if (!response.ok) {
    throw new Error(payload.message ?? "获取知识库失败。")
  }

  return payload.data ?? []
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocumentWithChunks[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    category: "家庭原则",
    source: "家庭整理",
    content: "",
  })

  useEffect(() => {
    let mounted = true

    void (async () => {
      setLoading(true)
      setError("")

      try {
        const nextDocuments = await fetchKnowledgeDocuments()
        if (mounted) {
          setDocuments(nextDocuments)
        }
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "获取知识库失败。")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  const model = useMemo(() => buildKnowledgePageModel(documents), [documents])

  async function handleCreateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = form.title.trim()
    const trimmedContent = form.content.trim()

    if (!trimmedTitle || !trimmedContent) {
      setError("请填写标题和正文后再保存。")
      return
    }

    setSaving(true)
    setError("")

    try {
      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          category: form.category.trim() || "家庭原则",
          source: form.source.trim() || "家庭整理",
          content: trimmedContent,
        }),
      })

      const payload = (await response.json()) as { data?: KnowledgeDocumentWithChunks; message?: string }

      if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? "创建知识文档失败。")
      }

      setDocuments((current) => [payload.data as KnowledgeDocumentWithChunks, ...current])
      setForm({
        title: "",
        category: form.category,
        source: form.source,
        content: "",
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "创建知识文档失败。")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setDeletingId(documentId)
    setError("")

    try {
      const response = await fetch(`/api/knowledge/${encodeURIComponent(documentId)}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      })

      const payload = (await response.json()) as { data?: KnowledgeDocumentWithChunks; message?: string }

      if (!response.ok) {
        throw new Error(payload.message ?? "删除知识文档失败。")
      }

      setDocuments((current) => current.filter((item) => item.id !== documentId))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "删除知识文档失败。")
    } finally {
      setDeletingId("")
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">知识库</h1>
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 hover:bg-emerald-50">
                  {model.totalDocuments} 条文档
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                用来整理家里常见用药原则、医院带回来的提醒、复诊前的说明和其他可复用的健康笔记。助手会把这里的内容当作背景资料，但不会把它们当成诊断结论。
              </p>
            </div>

            <Button
              className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              type="button"
              variant="outline"
              onClick={() => {
                void (async () => {
                  setLoading(true)
                  setError("")
                  try {
                    setDocuments(await fetchKnowledgeDocuments())
                  } catch (nextError) {
                    setError(nextError instanceof Error ? nextError.message : "刷新知识库失败。")
                  } finally {
                    setLoading(false)
                  }
                })()
              }}
            >
              <RefreshCwIcon className="size-4" aria-hidden="true" />
              刷新列表
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <BookOpenTextIcon className="size-4 text-emerald-500" aria-hidden="true" />
                文档总量
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{model.totalDocuments}</p>
              <p className="mt-1 text-sm text-slate-500">适合放家庭原则、药品注意事项和病房整理笔记。</p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-700">
                <LibraryBigIcon className="size-4" aria-hidden="true" />
                分类数量
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{model.totalCategories}</p>
              <p className="mt-1 text-sm text-slate-500">把过敏、发热、复诊和住院笔记分开写会更好查。</p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                <RefreshCwIcon className="size-4" aria-hidden="true" />
                最近更新
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {model.latestUpdatedAt ? model.latestUpdatedAt.slice(0, 10) : "暂无"}
              </p>
              <p className="mt-1 text-sm text-slate-500">新条目会优先排在前面，方便助手和人工复查。</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm font-medium text-emerald-700">适合先录入的内容</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              家庭用药原则、儿童和老人剂量提醒、医院出院单上的注意事项、复诊前需要复述的病史，以及那些“每次都得再说一遍”的经验笔记。
            </p>
          </div>
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">新增文档</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">把一条知识整理成可检索条目</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <PlusIcon className="size-5" aria-hidden="true" />
                </span>
              </div>

              <form className="grid gap-4" onSubmit={(event) => void handleCreateDocument(event)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    标题
                    <Input
                      className="rounded-2xl border-slate-200 bg-slate-50/70"
                      onChange={(event) => {
                        setForm((current) => ({ ...current, title: event.target.value }))
                      }}
                      placeholder="例如：布洛芬用药提醒"
                      value={form.title}
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    分类
                    <Input
                      className="rounded-2xl border-slate-200 bg-slate-50/70"
                      onChange={(event) => {
                        setForm((current) => ({ ...current, category: event.target.value }))
                      }}
                      placeholder="例如：用药提醒"
                      value={form.category}
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    来源
                    <Input
                      className="rounded-2xl border-slate-200 bg-slate-50/70"
                      onChange={(event) => {
                        setForm((current) => ({ ...current, source: event.target.value }))
                      }}
                      placeholder="例如：出院单 / 家庭整理"
                      value={form.source}
                    />
                  </label>

                  <div className="grid gap-2 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">保存方式</span>
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-3 leading-6">
                      保存后会自动进入助手的关键词检索，不需要额外配置。
                    </div>
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  内容
                  <Textarea
                    className="min-h-40 rounded-[22px] border-slate-200 bg-slate-50/70"
                    onChange={(event) => {
                      setForm((current) => ({ ...current, content: event.target.value }))
                    }}
                    placeholder="例如：发热时先测体温，确认是否重复服用退烧药，若精神状态变差及时复诊。"
                    value={form.content}
                  />
                </label>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">适合把家里反复用到的原则写成短句，后面更容易检索。</p>
                  <Button className="rounded-2xl bg-slate-900 px-5 text-white hover:bg-slate-800" disabled={saving} type="submit">
                    {saving ? "保存中..." : "保存文档"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">文档列表</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{loading ? "正在加载..." : `${model.documents.length} 条可用资料`}</p>
                </div>
                <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-100" variant="secondary">
                  知识检索
                </Badge>
              </div>

              {error ? (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>
              ) : null}

              {model.documents.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-emerald-500 shadow-sm">
                    <BookOpenTextIcon className="size-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-slate-950">还没有知识条目</h2>
                  <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    先录入一两条家庭原则，例如“发热先观察体温”和“青霉素疑似过敏要主动说明”，后面助手就能把它们当作背景资料。
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {model.documents.map((document) => (
                    <article
                      className="grid gap-4 rounded-[24px] border border-slate-100 bg-slate-50/70 p-4"
                      key={document.id}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">{document.title}</h3>
                            <Badge className="rounded-full px-3 py-1" variant="secondary">
                              {document.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">来源：{document.source}</p>
                        </div>

                        <Button
                          className="rounded-2xl border-slate-200 bg-white text-rose-600 hover:bg-rose-50"
                          disabled={deletingId === document.id}
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => {
                            void handleDeleteDocument(document.id)
                          }}
                        >
                          <Trash2Icon className="size-4" aria-hidden="true" />
                          {deletingId === document.id ? "删除中..." : "删除"}
                        </Button>
                      </div>

                      <p className="text-sm leading-6 text-slate-600">{document.preview}</p>

                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          {document.chunkCount} 个知识片段
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          创建于 {document.createdAt.slice(0, 10)}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                          更新于 {document.updatedAt.slice(0, 10)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </section>
    </div>
  )
}
