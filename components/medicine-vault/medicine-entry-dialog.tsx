"use client"

import { useMemo, useState, type ReactNode } from "react"
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
  name: string
  category: string
  dosage: string
  specification: string
  instructions: string
  purpose: string
  aiSummary: string
  warnings: string[]
}

const fields = [
  { name: "name", label: "药品名称", placeholder: "例如：阿莫西林胶囊" },
  { name: "category", label: "分类", placeholder: "例如：抗感染" },
  { name: "dosage", label: "剂量", placeholder: "例如：0.25g/粒" },
  { name: "specification", label: "规格", placeholder: "例如：0.25g * 24 粒" },
  { name: "purpose", label: "治疗疾病", placeholder: "例如：用于缓解发热和轻中度疼痛。" },
  { name: "expiresAt", label: "有效期", placeholder: "例如：2027-01-31" },
] as const

const textareaFields = [
  {
    name: "instructions",
    label: "使用说明",
    placeholder: "记录服用方式、频率或特别提醒。",
  },
] as const

export function MedicineEntryDialog({
  memberId,
  triggerLabel,
  triggerVariant = "outline",
  triggerClassName,
  triggerIcon,
  medicineId,
  dialogTitle = "新增药品记录",
  dialogDescription = "先上传药盒或说明书图片，AI 会帮你回填药品信息；保存前你仍然可以手动修改。",
  submitLabel = "保存药品",
  initialValues: initialValuesProp,
}: Readonly<{
  memberId: string
  triggerLabel: string
  triggerVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  triggerClassName?: string
  triggerIcon?: ReactNode
  medicineId?: string
  dialogTitle?: string
  dialogDescription?: string
  submitLabel?: string
  initialValues?: Record<string, string>
}>) {
  const router = useRouter()
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        [...fields, ...textareaFields].map((field) => [field.name, initialValuesProp?.[field.name] ?? ""])
      ) as Record<string, string>,
    [initialValuesProp]
  )

  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [aiSummary, setAiSummary] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])

  function resetDialog() {
    setValues(initialValues)
    setImageFile(null)
    setImageName("")
    setIsExtracting(false)
    setIsSubmitting(false)
    setErrorMessage("")
    setSuccessMessage("")
    setAiSummary("")
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

  async function handleExtract() {
    if (!imageFile) {
      setErrorMessage("请先选择一张药品图片。")
      return
    }

    try {
      setIsExtracting(true)
      setErrorMessage("")
      setSuccessMessage("")

      const formData = new FormData()
      formData.append("image", imageFile)

      const response = await fetch("/api/medicines/extract", {
        method: "POST",
        body: formData,
      })
      const result = (await response.json()) as {
        message?: string
        data?: ExtractResult
      }

      if (!response.ok || !result.data) {
        throw new Error(result.message ?? "图片识别失败。")
      }

      setValues((current) => ({
        ...current,
        name: result.data?.name ?? current.name,
        category: result.data?.category ?? current.category,
        dosage: result.data?.dosage ?? current.dosage,
        specification: result.data?.specification ?? current.specification,
        instructions: result.data?.instructions ?? current.instructions,
        purpose: result.data?.purpose ?? current.purpose,
      }))
      setAiSummary(result.data.aiSummary)
      setWarnings(result.data.warnings)
      setSuccessMessage(result.message ?? "图片识别完成，已回填到表单。")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "图片识别失败。")
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

      const response = await fetch(medicineId ? `/api/medicines/${medicineId}` : "/api/medicines", {
        method: medicineId ? "PATCH" : "POST",
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
        throw new Error(result.message ?? "保存药品失败。")
      }

      setSuccessMessage(result.message ?? "药品记录已写入数据库。")
      setOpen(false)
      resetDialog()
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存药品失败。")
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
                <p className="text-sm font-medium text-slate-900">药品图片识别</p>
                <p className="mt-1 text-sm text-slate-500">
                  支持上传药盒、标签或说明书图片，AI 会回填分类、规格、使用说明和适应症。
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
              <Label htmlFor="medicine-image">上传图片</Label>
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center text-sm text-slate-500" htmlFor="medicine-image">
                  <UploadIcon className="size-5 text-slate-400" aria-hidden="true" />
                  <span>{imageName || "点击选择一张本地图片"}</span>
                </label>
                <Input accept="image/*" className="hidden" id="medicine-image" onChange={handleFileChange} type="file" />
              </div>
            </div>

            {aiSummary ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-slate-700">
                <p className="font-medium text-emerald-700">AI 摘要</p>
                <p className="mt-2">{aiSummary}</p>
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
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "保存中..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
