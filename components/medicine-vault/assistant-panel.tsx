"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  BotIcon,
  ChevronRightIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { AssistantQueryResponse } from "@/features/medicine-vault/assistant-service"
import type { AssistantIntent } from "@/features/medicine-vault/assistant-routing"

const suggestedQuestions = [
  "我上次什么时候感冒？",
  "我最近吃过哪些药？",
  "我之前咳嗽看过几次？",
  "布洛芬和我的过敏史有没有冲突？",
  "家里有哪些抗过敏药？",
  "布洛芬和感冒灵能不能一起吃？",
  "家里有哪些过期药需要处理？",
  "我之前对哪些药有过不适？",
  "布洛芬缓释胶囊怎么吃？",
  "下次看医生前应该准备哪些问题？",
]

const intentLabels: Record<AssistantIntent, string> = {
  recent_cold_record: "感冒记录",
  allergy_history: "过敏记录",
  medicine_usage: "用药说明",
  medicine_interaction: "药物相互作用",
  medicine_disposal: "过期药处理",
  recent_medicine_history: "近期用药",
  symptom_history: "症状回顾",
  medicine_allergy_conflict: "过敏核对",
  medicine_query: "药品查询",
  visit_preparation: "就医准备",
  unsupported: "未支持",
}

function buildVisitPreparationHref(memberId?: string) {
  return memberId ? `/visit-prep?memberId=${encodeURIComponent(memberId)}` : ""
}

export function AssistantPanel() {
  const [question, setQuestion] = useState("我上次什么时候感冒？")
  const [result, setResult] = useState<AssistantQueryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const sourceCount = result?.sources.length ?? 0
  const resultIntentLabel = result ? intentLabels[result.intent] : "等待提问"
  const visitPreparationHref =
    result?.intent === "visit_preparation" ? buildVisitPreparationHref(result.sources[0]?.memberId) : ""
  const canSubmit = useMemo(() => question.trim().length > 0 && !loading, [loading, question])

  async function submitQuestion(nextQuestion = question) {
    const trimmedQuestion = nextQuestion.trim()
    if (!trimmedQuestion) {
      setError("请输入一个问题后再发送。")
      setResult(null)
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/assistant/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmedQuestion }),
      })

      const payload = (await response.json()) as AssistantQueryResponse

      if (!response.ok) {
        setResult(null)
        setError(payload.message ?? "助手查询失败。")
        return
      }

      setResult(payload)
      setError("")
    } catch {
      setResult(null)
      setError("网络暂时不可用，请稍后再试。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.06)] md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">AI 助手</h1>
                <Badge className="rounded-full bg-violet-50 px-3 py-1 text-violet-600 hover:bg-violet-50">
                  意图路由模式
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                先识别你在问什么，再去查病历或药品库，最后返回带来源依据的答案。AI 只做资料整理，不替代医生或药师。
              </p>
            </div>

            <Button className="rounded-2xl bg-violet-500 px-4 text-white shadow-sm hover:bg-violet-600" type="button">
              <SparklesIcon aria-hidden="true" data-icon="inline-start" />
              生成就医摘要
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <MessageSquareTextIcon className="size-4 text-violet-500" aria-hidden="true" />
                支持意图
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">10</p>
              <p className="mt-1 text-sm text-slate-500">当前保留十个固定意图，回答稳定且带来源。</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <FileTextIcon className="size-4" aria-hidden="true" />
                当前结果
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{sourceCount}</p>
              <p className="mt-1 text-sm text-slate-500">答案会带上病历或药品库里的来源依据。</p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-700">
                <ShieldCheckIcon className="size-4" aria-hidden="true" />
                安全边界
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">已收敛</p>
              <p className="mt-1 text-sm text-slate-500">不做诊断、不做治疗建议，只做资料整理和来源说明。</p>
            </div>
          </div>

          <form
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              void submitQuestion()
            }}
          >
            <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
            <Input
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              onChange={(event) => {
                setQuestion(event.target.value)
              }}
              placeholder="输入你的问题，例如：我上次什么时候感冒？"
              value={question}
            />
            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800" disabled={!canSubmit} type="submit">
              {loading ? "查询中..." : "发送"}
            </Button>
          </form>
          {error ? (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>
          ) : null}
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <CardContent className="grid gap-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">推荐问题</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">从已有记录开始问</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 ring-1 ring-violet-100">
                  <BotIcon className="size-5" aria-hidden="true" />
                </span>
              </div>

              <div className="grid gap-3">
                {suggestedQuestions.map((suggestedQuestion) => (
                  <button
                    className="flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50/70 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    key={suggestedQuestion}
                    onClick={() => {
                      setQuestion(suggestedQuestion)
                      void submitQuestion(suggestedQuestion)
                    }}
                    type="button"
                  >
                    <span>{suggestedQuestion}</span>
                    <ChevronRightIcon className="size-4 text-slate-400" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-700">说明</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  右侧会展示 AI 的答案、识别到的意图和来源记录。没有识别到的问题会给出友好提示，不会硬答。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <CardContent className="grid gap-5 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-600">
                    <BotIcon className="size-4" aria-hidden="true" />
                    模型回答
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {result ? result.answer || "我暂时还没法回答这个问题。" : "等待你的问题"}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-100">
                    {resultIntentLabel}
                  </Badge>
                  {visitPreparationHref ? (
                    <Button
                      asChild
                      className="rounded-2xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      size="sm"
                      variant="outline"
                    >
                      <Link href={visitPreparationHref}>
                        <ArrowUpRightIcon className="size-4" aria-hidden="true" />
                        打开就医准备页
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>

              {result?.message ? (
                <section className="rounded-[22px] border border-amber-100 bg-amber-50/70 p-4">
                  <p className="text-sm font-medium text-amber-700">提示</p>
                  <p className="mt-3 text-sm leading-6 text-amber-700">{result.message}</p>
                </section>
              ) : null}

              <section className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-700">答案内容</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {result
                    ? result.answer
                    : "发送问题后，这里会显示基于病历和药品库整理后的答案，并附上来源依据。"}
                </p>
              </section>

              <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-700">依据来源</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result?.sources.length ? (
                      result.sources.map((source) => (
                        <Badge className="rounded-full px-3 py-1" key={`${source.label}-${source.detail}`} variant="secondary">
                          {source.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">这里会列出病历或药品来源。</span>
                    )}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-700">来源细节</p>
                  <ul className="mt-3 grid gap-2">
                    {result?.sources.length ? (
                      result.sources.map((source) => (
                        <li className="flex gap-2 rounded-2xl bg-white px-3 py-3 text-sm text-slate-600" key={source.detail}>
                          <ArrowUpRightIcon className="mt-0.5 size-4 text-violet-500" aria-hidden="true" />
                          <span>
                            <strong className="font-medium text-slate-800">{source.label}</strong>
                            <span className="block text-slate-500">{source.detail}</span>
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-500">还没有来源，先发一条问题试试。</li>
                    )}
                  </ul>
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                <ShieldCheckIcon className="mt-0.5 size-4 text-emerald-600" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-600">
                  当前支持感冒记录、近期用药、症状回顾、过敏核对、过敏记录、用药说明、药物相互作用、过期药处理、药品查询和就医准备十个意图。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </div>
  )
}
