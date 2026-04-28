import { ClipboardListIcon, DatabaseIcon, ShieldCheckIcon } from "lucide-react"
import type * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { RepositoryContext } from "@/features/medicine-vault/auth-context"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMembers,
  listMedicines,
  listVisitPreparations,
} from "@/features/medicine-vault/repository"

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

export async function VaultPreview({ ctx }: Readonly<{ ctx: RepositoryContext }>) {
  const [members, visitPreparations, medicalRecords, medicines, allergyRecords] = await Promise.all([
    listMembers(ctx),
    listVisitPreparations(ctx),
    listMedicalRecords(ctx),
    listMedicines(ctx),
    listAllergyRecords(ctx),
  ])
  const activeMember = members[0]
  const activePreparation = visitPreparations[0]
  const memberRecords = activeMember ? medicalRecords.filter((record) => record.memberId === activeMember.id) : []
  const memberMedicines = activeMember ? medicines.filter((medicine) => medicine.memberId === activeMember.id) : []
  const memberAllergies = activeMember ? allergyRecords.filter((record) => record.memberId === activeMember.id) : []

  return (
    <div className="grid gap-4">
      <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
        <CardContent className="grid gap-5 p-5">
          <div>
            <p className="text-sm font-medium text-slate-500">当前查询</p>
            <p className="mt-1 text-2xl leading-snug font-semibold text-slate-950">
              {activePreparation?.concern ?? "等待生成就医摘要"}
            </p>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {activePreparation?.summary ?? "接入真实数据后，这里会显示按成员聚合出的就医前摘要。"}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "相关病历", value: `${memberRecords.length} 条记录` },
              { label: "家庭药品", value: `${memberMedicines.length} 个条目` },
              { label: "过敏提示", value: `${memberAllergies.length} 条风险` },
            ].map((step) => (
              <div className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-3" key={step.label}>
                <p className="text-xs font-medium text-slate-500">{step.label}</p>
                <p className="mt-2 text-sm font-semibold leading-5 text-slate-900">{step.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="grid gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">药品库</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">常用药记录</p>
            </div>
            {memberMedicines.map((item, index) => (
              <div className="grid gap-2" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <Badge className="rounded-full px-3 py-1" variant={index === 0 ? "outline" : "secondary"}>{item.quantity}</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-600">{item.usageNote}</p>
                {index < memberMedicines.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
          <CardContent className="grid gap-4 p-5">
            <div>
              <p className="text-sm font-medium text-slate-500">历史资料</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">最近记录</p>
            </div>
            <div className="grid gap-3">
              {memberRecords.map((record) => (
                <div className="rounded-[18px] border border-slate-100 bg-slate-50/70 px-3 py-3 text-sm font-medium text-slate-700" key={record.id}>
                  {record.visitedAt} {record.diagnosis}
                </div>
              ))}
            </div>
            <Separator />
            <div className="grid gap-3">
              {insightItems.map((item) => (
                <div className="grid grid-cols-[1.5rem_1fr] gap-3" key={item.label}>
                  <item.icon className="mt-0.5 size-4 text-emerald-500" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="text-sm leading-6 text-slate-600">{item.value}</p>
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
