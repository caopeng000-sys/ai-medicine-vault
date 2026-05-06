import {
  BellRingIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  PillIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { buildHealthReminderSummary, type HealthReminderItem } from "@/features/medicine-vault/health-reminders"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMembers,
  listMedicines,
} from "@/features/medicine-vault/repository"

export const dynamic = "force-dynamic"

const kindIconMap = {
  药品: PillIcon,
  复诊: CalendarClockIcon,
  过敏: ShieldAlertIcon,
} as const

const priorityToneMap = {
  高: {
    card: "border-rose-200 bg-rose-50/80",
    badge: "destructive" as const,
    icon: "text-rose-600",
  },
  中: {
    card: "border-orange-200 bg-orange-50/80",
    badge: "outline" as const,
    icon: "text-orange-600",
  },
  低: {
    card: "border-amber-200 bg-amber-50/80",
    badge: "outline" as const,
    icon: "text-amber-600",
  },
} as const

function ReminderCard({ item }: Readonly<{ item: HealthReminderItem }>) {
  const KindIcon = kindIconMap[item.kind]
  const tone = priorityToneMap[item.priority]

  return (
    <Card className={`overflow-hidden rounded-[24px] shadow-[0_14px_44px_rgba(15,23,42,0.05)] ${tone.card}`}>
      <CardContent className="grid gap-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <KindIcon className={`size-4 ${tone.icon}`} aria-hidden="true" />
              <Badge className="rounded-full px-2.5 py-1" variant={tone.badge}>
                {item.priority}优先级
              </Badge>
              <Badge className="rounded-full px-2.5 py-1" variant="secondary">
                {item.kind}
              </Badge>
              <Badge className="rounded-full px-2.5 py-1" variant="outline">
                {item.memberName}
              </Badge>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-1 text-sm font-medium text-slate-700">{item.message}</p>
            </div>
          </div>

          <Button
            asChild
            className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            variant="outline"
          >
            <Link href={item.href}>查看</Link>
          </Button>
        </div>

        <p className="text-sm leading-6 text-slate-600">{item.detail}</p>
        <p className="text-xs font-medium tracking-wide text-slate-500">关联日期 {item.dueAt || "暂无日期"}</p>
      </CardContent>
    </Card>
  )
}

export default async function RemindersPage() {
  const ctx = await requireCurrentUser()
  const [members, medicines, records, allergies] = await Promise.all([
    listMembers(ctx),
    listMedicines(ctx),
    listMedicalRecords(ctx),
    listAllergyRecords(ctx),
  ])
  const summary = buildHealthReminderSummary({ members, medicines, records, allergies })
  const statCards = [
    {
      label: "高优先级",
      value: summary.highCount,
      description: "已过期药、严重过敏或逾期复诊",
      tone: "border-rose-100 bg-rose-50/85 text-rose-700",
      icon: TriangleAlertIcon,
    },
    {
      label: "中优先级",
      value: summary.mediumCount,
      description: "库存不足、临近复诊或中等风险",
      tone: "border-orange-100 bg-orange-50/85 text-orange-700",
      icon: BellRingIcon,
    },
    {
      label: "低优先级",
      value: summary.lowCount,
      description: "即将过期或后续可整理事项",
      tone: "border-amber-100 bg-amber-50/85 text-amber-700",
      icon: ClipboardListIcon,
    },
    {
      label: "全部提醒",
      value: summary.total,
      description: "药品、复诊和过敏统一汇总",
      tone: "border-emerald-100 bg-emerald-50/85 text-emerald-700",
      icon: CheckCircle2Icon,
    },
  ] as const

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">提醒中心</h1>
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 hover:bg-emerald-50">
                  {summary.total} 条待处理
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                把药品过期、库存不足、复诊时间和过敏风险集中到一个工作台，先处理最容易遗漏的家庭健康事项。
              </p>
            </div>

            <Button asChild className="rounded-2xl bg-emerald-500 px-4 text-white shadow-sm hover:bg-emerald-600">
              <Link href="/medicines">
                <PillIcon data-icon="inline-start" />
                维护药品库
              </Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => (
              <div className={`rounded-2xl border p-4 ${item.tone}`} key={item.label}>
                <p className="inline-flex items-center gap-2 text-sm font-medium">
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-600">药品提醒</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.medicineCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-600">复诊提醒</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.followUpCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-600">过敏风险</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.allergyCount}</p>
            </div>
          </div>
        </div>

        {summary.items.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/75 px-5 py-12 text-center">
            <p className="text-lg font-semibold text-slate-950">当前没有需要优先处理的提醒</p>
            <p className="mt-2 text-sm text-slate-500">继续维护药品有效期、库存、复诊时间和过敏记录后，这里会自动汇总。</p>
          </div>
        ) : (
          <section className="mt-6 grid gap-4 xl:grid-cols-2">
            {summary.items.map((item) => (
              <ReminderCard item={item} key={item.id} />
            ))}
          </section>
        )}
      </section>
    </div>
  )
}
