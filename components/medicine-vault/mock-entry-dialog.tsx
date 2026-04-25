"use client"

import { useMemo, useState } from "react"

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
  type?: "text" | "textarea"
}

export function MockEntryDialog({
  triggerLabel,
  title,
  description,
  submitLabel = "保存原型",
  fields,
}: Readonly<{
  triggerLabel: string
  title: string
  description: string
  submitLabel?: string
  fields: MockField[]
}>) {
  const initialValues = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.name, ""])),
    [fields]
  )
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [submittedValues, setSubmittedValues] = useState<Record<string, string> | null>(null)

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function resetDialog() {
    setValues(initialValues)
    setSubmittedValues(null)
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetDialog()
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittedValues(values)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
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
                当前只完成交互验证，还没有真正写入成员、病历或药品数据。
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

            <DialogFooter>
              <Button onClick={() => setOpen(false)} type="button" variant="secondary">
                取消
              </Button>
              <Button type="submit">{submitLabel}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
