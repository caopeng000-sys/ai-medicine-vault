import { ArrowRightIcon, Clock3Icon, ShieldAlertIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { MedicineReminderSummary } from "@/features/medicine-vault/medicine-reminders"

const reminderToneMap = {
  已过期: {
    container: "border-rose-200 bg-rose-50/80",
    badge: "destructive" as const,
    icon: TriangleAlertIcon,
    accent: "text-rose-600",
  },
  库存不足: {
    container: "border-orange-200 bg-orange-50/80",
    badge: "outline" as const,
    icon: ShieldAlertIcon,
    accent: "text-orange-600",
  },
  即将过期: {
    container: "border-amber-200 bg-amber-50/80",
    badge: "outline" as const,
    icon: Clock3Icon,
    accent: "text-amber-600",
  },
} as const

export function MedicineReminderPanel({ summary }: Readonly<{ summary: MedicineReminderSummary }>) {
  return (
    <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] md:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <p className="text-sm font-medium text-slate-500">提醒中心</p>
            <h2 className="text-xl font-semibold text-slate-950">紧急药品提醒</h2>
            <p className="text-sm leading-6 text-slate-500">
              已过期、库存不足和即将过期的药品会在这里集中出现，方便先处理最紧急的条目。
            </p>
          </div>

          <Badge className="rounded-full px-3 py-1" variant="secondary">
            {summary.total} 条提醒
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: "已过期", value: summary.expiredCount, tone: "text-rose-600 bg-rose-50 border-rose-100" },
            { label: "库存不足", value: summary.lowStockCount, tone: "text-orange-600 bg-orange-50 border-orange-100" },
            { label: "即将过期", value: summary.expiringSoonCount, tone: "text-amber-600 bg-amber-50 border-amber-100" },
          ].map((item) => (
            <div className={`rounded-[20px] border p-4 ${item.tone}`} key={item.label}>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>

        {summary.items.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
            当前没有需要优先处理的药品提醒。
          </div>
        ) : (
          <div className="grid gap-3">
            {summary.items.map((item) => {
              const tone = reminderToneMap[item.status]
              const StatusIcon = tone.icon

              return (
                <div className={`rounded-[22px] border p-4 ${tone.container}`} key={item.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="grid gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusIcon className={`size-4 ${tone.accent}`} aria-hidden="true" />
                        <Link
                          className="text-base font-semibold text-slate-950 underline-offset-4 hover:underline"
                          href={`/medicines?q=${encodeURIComponent(item.name)}`}
                        >
                          {item.name}
                        </Link>
                        <Badge className="rounded-full px-2.5 py-1" variant={tone.badge}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        {item.memberName} · {item.category}
                      </p>
                      <p className="text-sm leading-6 text-slate-700">{item.message}</p>
                      <p className="text-xs font-medium tracking-wide text-slate-500">
                        到期日期 {item.expiresAt} · 库存 {item.quantity}
                      </p>
                    </div>

                    <Button
                      asChild
                      className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                      size="sm"
                      variant="outline"
                    >
                      <Link href={`/medicines?q=${encodeURIComponent(item.name)}`}>
                        聚焦此药
                        <ArrowRightIcon className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-xs leading-5 text-slate-500">
          提醒顺序按{"“已过期 > 库存不足 > 即将过期”"}排列，规则复用药品状态计算结果。
        </p>
      </div>
    </section>
  )
}
