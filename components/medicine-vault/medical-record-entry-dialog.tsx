"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { LoaderCircleIcon, SparklesIcon, UploadIcon } from "lucide-react"
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

type ExtractResult = {
  visitedAt: string
  hospital: string
  diagnosis: string
  symptoms: string
  advice: string
  summary: string
  originalText: string
  warnings: string[]
}

const fields = [
  { name: "visitedAt", label: "就诊日期", placeholder: "例如：2026-04-25" },
  { name: "hospital", label: "医院与科室", placeholder: "例如：市立医院 / 呼吸科" },
  { name: "diagnosis", label: "诊断结论", placeholder: "例如：上呼吸道感染倾向" },
] as const

const textareaFields = [
  {
    name: "symptoms",
    label: "症状描述",
    placeholder: "记录就诊时的主要症状和持续时间。",
  },
  {
    name: "advice",
    label: "医生建议",
    placeholder: "记录复诊建议、观察点和禁忌提醒。",
  },
] as const

export function MedicalRecordEntryDialog({
  memberId,
  triggerLabel,
  triggerVariant = "outline",
  triggerClassName,
  triggerIcon,
  dialogTitle = "新增病历记录",
  dialogDescription = "先上传病历或门诊报告图片，AI 会帮你回填就诊信息；确认后保存到数据库。",
  submitLabel = "保存病历",
}: Readonly<{
  memberId: string
  triggerLabel: string
  triggerVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  triggerClassName?: string
  triggerIcon?: ReactNode
  dialogTitle?: string
  dialogDescription?: string
  submitLabel?: string
}>) {
  const router = useRouter()
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        [...fields, ...textareaFields].map((field) => [field.name, ""])
      ) as Record<string, string>,
    []
  )

  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState("")
  const [imagePreviewUrl, setImagePreviewUrl] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [originalText, setOriginalText] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])
  const imageInputRef = useRef<HTMLInputElement>(null)

  function resetDialog() {
    setValues(initialValues)
    setImageFile(null)
    setImageName("")
    setImagePreviewUrl("")
    setIsExtracting(false)
    setIsSubmitting(false)
    setErrorMessage("")
    setSuccessMessage("")
    setAiSummary("")
    setOriginalText("")
    setWarnings([])
  }

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetDialog()
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setImageFile(file)
    setImageName(file?.name ?? "")
    setErrorMessage("")
  }

  function openFilePicker() {
    if (!imageInputRef.current) {
      return
    }

    imageInputRef.current.value = ""
    imageInputRef.current.click()
  }

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("")
      return
    }

    const previewUrl = URL.createObjectURL(imageFile)
    setImagePreviewUrl(previewUrl)

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [imageFile])

  async function handleExtract() {
    if (!imageFile) {
      setErrorMessage("请先选择一张病历图片。")
      return
    }

    try {
      setIsExtracting(true)
      setErrorMessage("")
      setSuccessMessage("")

      const formData = new FormData()
      formData.append("image", imageFile)

      const response = await fetch("/api/records/extract", {
        method: "POST",
        body: formData,
      })
      const result = (await response.json()) as {
        message?: string
        data?: ExtractResult
      }

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "病历图片识别失败。")
      }

      setValues((current) => ({
        ...current,
        visitedAt: result.data?.visitedAt ?? current.visitedAt,
        hospital: result.data?.hospital ?? current.hospital,
        diagnosis: result.data?.diagnosis ?? current.diagnosis,
        symptoms: result.data?.symptoms ?? current.symptoms,
        advice: result.data?.advice ?? current.advice,
      }))
      setAiSummary(result.data.summary)
      setOriginalText(result.data.originalText)
      setWarnings(result.data.warnings)
      setSuccessMessage(result.message ?? "病历图片识别完成，已回填到表单。")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "病历图片识别失败。")
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)
      setErrorMessage("")
      setSuccessMessage("")

      const response = await fetch("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          memberId,
        }),
      })
      const result = (await response.json()) as { message?: string }

      if (!response.ok) {
        throw new Error(result.message ?? "保存病历失败。")
      }

      setSuccessMessage(result.message ?? "病历记录已写入数据库。")
      setOpen(false)
      resetDialog()
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存病历失败。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} type="button" variant={triggerVariant}>
          {triggerIcon ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              {triggerIcon}
            </span>
          ) : null}
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">病历图片识别</p>
                <p className="mt-1 text-sm text-slate-500">
                  支持上传病历、门诊报告或处方单图片，AI 会尽量整理出就诊日期、医院科室、诊断和医生建议。
                </p>
              </div>
              <Button disabled={!imageFile || isExtracting} onClick={handleExtract} type="button">
                {isExtracting ? (
                  <>
                    <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
                    识别中...
                  </>
                ) : (
                  <>
                    <SparklesIcon aria-hidden="true" />
                    AI 识别图片
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="medical-record-image">上传图片</Label>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-3">
                {imagePreviewUrl ? (
                  <button
                    className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left shadow-sm transition hover:border-slate-300"
                    onClick={openFilePicker}
                    type="button"
                  >
                    <img
                      alt={imageName || "病历图片预览"}
                      className="h-56 w-full bg-white object-cover object-center transition duration-200 group-hover:scale-[1.01]"
                      src={imagePreviewUrl}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 via-slate-950/35 to-transparent px-4 py-3">
                      <p className="text-sm font-medium text-white">点击图片可重新选择</p>
                      <p className="mt-0.5 truncate text-xs text-white/80">{imageName}</p>
                    </div>
                  </button>
                ) : (
                  <button
                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500 transition hover:border-slate-300 hover:bg-white"
                    onClick={openFilePicker}
                    type="button"
                  >
                    <UploadIcon className="size-5 text-slate-400" aria-hidden="true" />
                    <span>点击选择一张本地图片</span>
                    <span className="text-xs text-slate-400">支持病历、门诊报告、处方单图片</span>
                  </button>
                )}
                <Input
                  accept="image/*"
                  className="hidden"
                  id="medical-record-image"
                  onChange={handleFileChange}
                  ref={imageInputRef}
                  type="file"
                />
              </div>
              <p className="text-xs leading-5 text-slate-400">
                选中的图片会展示在这里，识别结果会回填到下方表单，保存前仍可手动修改。
              </p>
            </div>

            {aiSummary || originalText || warnings.length > 0 ? (
              <div className="grid gap-3">
                {aiSummary ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-slate-700">
                    <p className="font-medium text-emerald-700">AI 总结</p>
                    <p className="mt-2 whitespace-pre-line">{aiSummary}</p>
                  </div>
                ) : null}

                {originalText ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    <p className="font-medium text-slate-900">识别原文</p>
                    <p className="mt-2 whitespace-pre-wrap text-slate-600">{originalText}</p>
                  </div>
                ) : null}

                {warnings.length > 0 ? (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 text-sm leading-6 text-amber-800">
                    <p className="font-medium">识别提醒</p>
                    <ul className="mt-2 grid gap-1">
                      {warnings.map((warning) => (
                        <li key={warning}>- {warning}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div className="grid gap-2" key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <Input
                  id={field.name}
                  onChange={(event) => updateValue(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  value={values[field.name]}
                />
              </div>
            ))}
          </section>

          <section className="grid gap-4">
            {textareaFields.map((field) => (
              <div className="grid gap-2" key={field.name}>
                <Label htmlFor={field.name}>{field.label}</Label>
                <Textarea
                  id={field.name}
                  onChange={(event) => updateValue(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  value={values[field.name]}
                />
              </div>
            ))}
          </section>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="secondary">
              取消
            </Button>
            <Button disabled={isSubmitting || !memberId} type="submit">
              {isSubmitting ? "保存中..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
