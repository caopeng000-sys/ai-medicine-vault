import { ClipboardListIcon, DatabaseIcon, ShieldCheckIcon } from "lucide-react"
import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { medicineItems, recordItems, workflowSteps } from "@/features/medicine-vault/data"

const insightItems: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  value: string
}[] = [
  {
    icon: DatabaseIcon,
    label: "个人资料优先",
    value: "历史病历与药品说明先被检索",
  },
  {
    icon: ShieldCheckIcon,
    label: "安全边界",
    value: "输出用于整理问题，不替代医生判断",
  },
  {
    icon: ClipboardListIcon,
    label: "可带走清单",
    value: "把症状、用药、疑问汇总成就诊笔记",
  },
]

export function VaultPreview() {
  return (
    <div className="grid gap-4">
      <Card className="border-primary/20 bg-card/90 shadow-xl shadow-primary/5">
        <CardHeader>
          <CardDescription>当前查询</CardDescription>
          <CardTitle className="text-2xl leading-snug">咳嗽 + 低烧 + 家中常备药</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="text-sm leading-7 text-muted-foreground">
            AI 将优先检索你的历史病历、过敏记录和药品说明，生成摘要和待确认问题。
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {workflowSteps.map((step) => (
              <div className="rounded-lg border bg-background p-3" key={step.label}>
                <p className="text-xs font-medium text-muted-foreground">{step.label}</p>
                <p className="mt-2 text-sm font-semibold leading-5">{step.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardDescription>药品库</CardDescription>
            <CardTitle>常用药记录</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {medicineItems.map((item, index) => (
              <div className="grid gap-2" key={item.name}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.name}</p>
                  <Badge variant={index === 2 ? "outline" : "secondary"}>{item.status}</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
                {index < medicineItems.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>历史资料</CardDescription>
            <CardTitle>最近记录</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3">
              {recordItems.map((record) => (
                <div className="rounded-lg border bg-background px-3 py-3 text-sm font-medium" key={record}>
                  {record}
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-3">
              {insightItems.map((item) => (
                <div className="grid grid-cols-[1.5rem_1fr] gap-3" key={item.label}>
                  <item.icon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-sm leading-6 text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
