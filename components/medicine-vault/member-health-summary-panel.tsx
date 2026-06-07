"use client"

import { useState } from "react"
import { CheckIcon, ClipboardCopyIcon, LoaderCircleIcon, SparklesIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatMemberHealthSummaryForCopy,
  type MemberHealthSummary,
} from "@/features/medicine-vault/member-health-summary-shared"

type MemberHealthSummaryPanelProps = Readonly<{
  memberId: string
  memberName: string
}>

export function MemberHealthSummaryPanel({ memberId, memberName }: MemberHealthSummaryPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<MemberHealthSummary | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError("")
    setCopied(false)

    try {
      const response = await fetch(`/api/members/${memberId}/health-summary`, {
        method: "POST",
      })
      const payload = (await response.json()) as {
        message?: string
        data?: MemberHealthSummary
      }

      if (!response.ok || !payload.data) {
        throw new Error(payload.message ?? "生成成员健康摘要失败。")
      }

      setSummary(payload.data)
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "生成成员健康摘要失败。")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!summary) {
      return
    }

    try {
      await navigator.clipboard.writeText(formatMemberHealthSummaryForCopy(summary))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("复制到剪贴板失败，请手动选择文本复制。")
    }
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardDescription>AI 资料整理</CardDescription>
        <CardTitle>{memberName} 的健康档案摘要</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm leading-6">
        <p className="text-muted-foreground">
          基于病历、药品与过敏记录生成摘要，适合复诊前整理或复制给新医生参考。不构成诊断或用药建议。
        </p>

        <div className="flex flex-wrap gap-2">
          <Button disabled={loading} onClick={handleGenerate} type="button">
            {loading ? (
              <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            生成 AI 摘要
          </Button>
          {summary ? (
            <Button disabled={loading} onClick={handleCopy} type="button" variant="outline">
              {copied ? <CheckIcon data-icon="inline-start" /> : <ClipboardCopyIcon data-icon="inline-start" />}
              {copied ? "已复制" : "复制全文"}
            </Button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        {summary ? (
          <div className="grid gap-4">
            <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="font-medium">给新医生看的 30 秒摘要</p>
              <p className="mt-2 text-muted-foreground">{summary.doctorBrief}</p>
            </section>

            <section className="grid gap-2">
              <p className="font-medium">慢性病史 / 就诊时间线</p>
              <ul className="grid gap-2">
                {summary.chronicTimeline.map((item) => (
                  <li className="rounded-lg border bg-background px-3 py-2 text-muted-foreground" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="grid gap-2">
              <p className="font-medium">常用药摘要</p>
              <p className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">
                {summary.medicationSummary}
              </p>
            </section>

            <section className="grid gap-2">
              <p className="font-medium">过敏与风险提示</p>
              <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-muted-foreground">
                {summary.allergyRisks}
              </p>
            </section>

            <section className="grid gap-2">
              <p className="font-medium">最近一次就医要点</p>
              <p className="rounded-lg border bg-background px-3 py-2 text-muted-foreground">
                {summary.lastVisitHighlight}
              </p>
            </section>

            {summary.sources.length > 0 ? (
              <section className="grid gap-2">
                <p className="font-medium">资料引用</p>
                <ul className="grid gap-2">
                  {summary.sources.map((source) => (
                    <li className="rounded-lg border bg-background px-3 py-2" key={`${source.label}-${source.detail}`}>
                      <p>{source.label}</p>
                      <p className="mt-1 text-muted-foreground">{source.detail}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
