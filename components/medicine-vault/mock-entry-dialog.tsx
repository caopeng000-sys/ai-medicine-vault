"use client"

import { useEffect, useMemo, useState } from "react"
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

type MockField = {
  name: string
  label: string
  placeholder: string
  type?: "text" | "textarea" | "select"
  options?: Array<{
    label: string
    value: string
  }>
}

export function MockEntryDialog({
  triggerLabel,
  triggerVariant = "outline",
  triggerClassName,
  title,
  description,
  submitLabel = "保存原型",
  fields,
  endpoint,
  payload,
  method = "POST",
  initialValues: initialValuesProp,
}: Readonly<{
  triggerLabel: string
  triggerVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link"
  triggerClassName?: string
  title: string
  description: string
  submitLabel?: string
  fields: MockField[]
  endpoint?: string
  payload?: Record<string, string>
  method?: "POST" | "PATCH"
  initialValues?: Record<string, string | number>
}>) {
  const router = useRouter()
  const initialValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [field.name, String(initialValuesProp?.[field.name] ?? "")])
      ),
    [fields, initialValuesProp]
  )
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null)
  const [successMessage, setSuccessMessage] = useState("当前只完成交互验证，还没有真正写入成员、病历或药品数据。")
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues])

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function resetDialog() {
    setValues(initialValues)
    setSubmittedValues(null)
    setErrorMessage("")
    setSuccessMessage("当前只完成交互验证，还没有真正写入成员、病历或药品数据。")
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetDialog()
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextValues = {
      ...values,
      ...payload,
    }

    if (!endpoint) {
      setSubmittedValues(nextValues)
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage("")

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextValues),
      })

      const result = (await response.json()) as { message?: string; data?: Record<string, string> }

      if (!response.ok) {
        throw new Error(result.message ?? "提交失败。")
      }

      setSubmittedValues(result.data ?? nextValues)
      setSuccessMessage(result.message ?? "已写入数据库。")
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "提交失败。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={triggerClassName} type="button" variant={triggerVariant}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {submittedValues ? (
          <div className="grid gap-4">
            <div className="rounded-lg border bg-background p-4 text-sm leading-6">
              <p className="font-medium">原型提交成功</p>
              <p className="mt-2 text-muted-foreground">
                {successMessage}
              </p>
            </div>

            <div className="grid gap-3">
              {fields.map((field) => (
                <div className="rounded-lg border bg-background p-4" key={field.name}>
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {submittedValues[field.name] || "未填写"}
                  </p>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={resetDialog} type="button" variant="secondary">
                继续填写
              </Button>
              <Button onClick={() => setOpen(false)} type="button">
                完成
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              {fields.map((field) => (
                <div className="grid gap-2" key={field.name}>
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      value={values[field.name]}
                    />
                  ) : field.type === "select" ? (
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      id={field.name}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      value={values[field.name]}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      onChange={(event) => updateValue(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      value={values[field.name]}
                    />
                  )}
                </div>
              ))}
            </div>

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
                {isSubmitting ? "提交中..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
