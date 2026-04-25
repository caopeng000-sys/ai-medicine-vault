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
import {
  allergyRecords,
  medicalRecords,
  medicines,
  members,
  visitPreparations,
} from "@/features/medicine-vault/data"

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
  const activeMember = members[0]
  const activePreparation = visitPreparations[0]
  const memberRecords = medicalRecords
    .filter((record) => record.memberId === activeMember.id)
    .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))
  const memberMedicines = medicines.filter((medicine) => medicine.memberId === activeMember.id)
  const memberAllergies = allergyRecords.filter((record) => record.memberId === activeMember.id)

  return (
    <div className="grid gap-4">
      <Card className="border-primary/20 bg-card/90 shadow-xl shadow-primary/5">
        <CardHeader>
          <CardDescription>当前查询</CardDescription>
          <CardTitle className="text-2xl leading-snug">{activePreparation.concern}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="text-sm leading-7 text-muted-foreground">
            {activePreparation.summary}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "相关病历", value: `${memberRecords.length} 条记录` },
              { label: "家庭药品", value: `${memberMedicines.length} 个条目` },
              { label: "过敏提示", value: `${memberAllergies.length} 条风险` },
            ].map((step) => (
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
            {memberMedicines.map((item, index) => (
              <div className="grid gap-2" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{item.name}</p>
                  <Badge variant={index === 0 ? "outline" : "secondary"}>{item.quantity}</Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item.usageNote}</p>
                {index < memberMedicines.length - 1 ? <Separator /> : null}
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
              {memberRecords.map((record) => (
                <div className="rounded-lg border bg-background px-3 py-3 text-sm font-medium" key={record.id}>
                  {record.visitedAt} {record.diagnosis}
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
