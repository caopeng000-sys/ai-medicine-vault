"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircleIcon, PaperclipIcon, SparklesIcon, UploadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ExtractedMedicalAttachmentResult } from "@/features/medicine-vault/medical-attachment-shared"

export function MedicalAttachmentEntryDialog({ memberId, medicalRecordId, triggerLabel = "上传报告附件" }: Readonly<{ memberId: string; medicalRecordId?: string; triggerLabel?: string }>) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState("")
  const [text, setText] = useState("")
  const [meta, setMeta] = useState<Omit<ExtractedMedicalAttachmentResult, "extractedText"> | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!imageFile) return void setPreview("")
    const url = URL.createObjectURL(imageFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  async function extract() {
    if (!imageFile) return setError("请先选择图片。")
    setExtracting(true)
    setError("")
    const fd = new FormData()
    fd.append("image", imageFile)
    const res = await fetch("/api/records/attachments/extract", { method: "POST", body: fd })
    const json = await res.json()
    setExtracting(false)
    if (!res.ok || !json.data) return setError(json.message ?? "识别失败。")
    setText(json.data.extractedText)
    setMeta(json.data.suggestedMetadata)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return setError("请填写 OCR 文本。")
    setSubmitting(true)
    setError("")
    const fd = new FormData()
    fd.append("memberId", memberId)
    fd.append("extractedText", text.trim())
    if (medicalRecordId) fd.append("medicalRecordId", medicalRecordId)
    if (imageFile) fd.append("image", imageFile)
    const res = await fetch("/api/records/attachments", { method: "POST", body: fd })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) return setError(json.message ?? "保存失败。")
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button type="button" variant="outline"><PaperclipIcon />{triggerLabel}</Button></DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>上传病历附件</DialogTitle><DialogDescription>报告 OCR 全文将纳入健康资料索引。</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <Button disabled={!imageFile || extracting} onClick={extract} type="button">{extracting ? <LoaderCircleIcon className="animate-spin" /> : <SparklesIcon />}AI 识别全文</Button>
          <button className="rounded border border-dashed p-4" onClick={() => inputRef.current?.click()} type="button">{preview ? <img alt="预览" className="mx-auto h-40 object-contain" src={preview} /> : <><UploadIcon className="mx-auto" />选择图片</>}</button>
          <Input accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} ref={inputRef} type="file" />
          {meta?.summary ? <p className="text-sm text-emerald-700">{meta.summary}</p> : null}
          <Textarea onChange={(e) => setText(e.target.value)} rows={8} value={text} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter><Button type="button" variant="secondary" onClick={() => setOpen(false)}>取消</Button><Button disabled={submitting || !text.trim()} type="submit">{submitting ? "保存中..." : "保存附件"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
