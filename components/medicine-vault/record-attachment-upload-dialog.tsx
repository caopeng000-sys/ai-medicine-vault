"use client"

import { useRef, useState } from "react"
import { SparklesIcon, UploadCloudIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const attachmentKinds = ["检查报告", "处方单", "就诊照片", "其他资料"] as const

export function RecordAttachmentUploadDialog({
  recordId,
}: Readonly<{
  recordId: string
}>) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<(typeof attachmentKinds)[number]>("检查报告")
  const [note, setNote] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)

  function resetDialog() {
    setKind("检查报告")
    setNote("")
    setAiSummary("")
    setErrorMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setErrorMessage("请先选择附件。")
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("kind", kind)
    formData.append("note", note)

    try {
      setIsSubmitting(true)
      setErrorMessage("")

      const response = await fetch(`/api/records/${recordId}/attachments`, {
        method: "POST",
        body: formData,
      })
      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message ?? "上传失败。")
      }

      resetDialog()
      setOpen(false)
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "上传失败。")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleExtract() {
    const file = fileInputRef.current?.files?.[0]

    if (!file) {
      setErrorMessage("请先选择附件图片。")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    try {
      setIsExtracting(true)
      setErrorMessage("")

      const response = await fetch("/api/records/attachments/extract", {
        method: "POST",
        body: formData,
      })
      const result = (await response.json()) as {
        message?: string
        data?: {
          documentType?: string
          summary?: string
          keyFindings?: string[]
          suggestedFollowUp?: string
          warnings?: string[]
        }
      }

      if (!response.ok) {
        throw new Error(result.message ?? "识别失败。")
      }

      const data = result.data
      const nextSummary = [
        data?.documentType ? `类型：${data.documentType}` : "",
        data?.summary ? `摘要：${data.summary}` : "",
        data?.keyFindings?.length ? `重点：${data.keyFindings.join("；")}` : "",
        data?.suggestedFollowUp ? `后续：${data.suggestedFollowUp}` : "",
        data?.warnings?.length ? `提醒：${data.warnings.join("；")}` : "",
      ]
        .filter(Boolean)
        .join("\n")

      setAiSummary(nextSummary)
      setNote((current) => [current.trim(), nextSummary].filter(Boolean).join("\n\n"))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "识别失败。")
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) resetDialog()
      }}
    >
      <DialogTrigger asChild>
        <Button className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50" variant="outline">
          <UploadCloudIcon data-icon="inline-start" />
          上传附件
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传病历附件</DialogTitle>
          <DialogDescription>支持检查报告、处方单、就诊照片和 PDF 文件。</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor={`record-attachment-file-${recordId}`}>附件文件</Label>
            <Input
              accept="image/jpeg,image/png,image/webp,application/pdf"
              id={`record-attachment-file-${recordId}`}
              ref={fileInputRef}
              type="file"
            />
            <Button
              className="w-fit rounded-xl border-sky-100 bg-sky-50 text-sky-700 hover:bg-sky-100"
              disabled={isExtracting || isSubmitting}
              onClick={handleExtract}
              type="button"
              variant="outline"
            >
              <SparklesIcon data-icon="inline-start" />
              {isExtracting ? "识别中..." : "AI 摘要"}
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`record-attachment-kind-${recordId}`}>附件类型</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id={`record-attachment-kind-${recordId}`}
              onChange={(event) => setKind(event.target.value as (typeof attachmentKinds)[number])}
              value={kind}
            >
              {attachmentKinds.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`record-attachment-note-${recordId}`}>备注</Label>
            <Textarea
              id={`record-attachment-note-${recordId}`}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：血常规报告，复诊前需要给医生看。"
              rows={3}
              value={note}
            />
          </div>

          {aiSummary ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-sm leading-6 text-slate-700">
              <p className="font-medium text-sky-700">AI 摘要结果</p>
              <p className="mt-2 whitespace-pre-line">{aiSummary}</p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "上传中..." : "保存附件"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
