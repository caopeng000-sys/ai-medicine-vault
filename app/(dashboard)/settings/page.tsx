"use client"

import { DownloadIcon, FileTextIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleExport() {
    setExporting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/export")

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        throw new Error(payload.message ?? "导出失败。")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      const date = new Date().toISOString().slice(0, 10)

      anchor.href = url
      anchor.download = `medrecord-export-${date}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage("导出文件已开始下载。")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败。")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-700">系统设置</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">账户与数据</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          导出您的家庭健康资料副本，或查看隐私政策与医疗免责声明。
        </p>
      </div>

      <Card className="rounded-[28px] border-slate-100 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <DownloadIcon aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-950">导出 JSON 数据</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                包含成员、病历、药品、过敏记录与就医准备清单。不包含药品原图二进制，仅保留是否有图等元数据。
              </p>
              <Button
                className="mt-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
                disabled={exporting}
                onClick={() => void handleExport()}
                type="button"
              >
                {exporting ? "正在导出..." : "下载导出文件"}
              </Button>
              {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[28px] border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon aria-hidden="true" className="size-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-950">隐私政策</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">了解我们如何处理与保护您的家庭健康资料。</p>
            <Button asChild className="mt-4 rounded-2xl" variant="outline">
              <Link href="/privacy">查看隐私政策</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileTextIcon aria-hidden="true" className="size-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-950">医疗免责声明</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">AI 功能仅用于资料整理，不能替代医生或药师判断。</p>
            <Button asChild className="mt-4 rounded-2xl" variant="outline">
              <Link href="/disclaimer">查看免责声明</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
