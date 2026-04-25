import {
  ArrowRightIcon,
  ClipboardListIcon,
  FilePlus2Icon,
  PillIcon,
  ShieldAlertIcon,
  SparklesIcon,
  StethoscopeIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { VaultPreview } from "@/components/medicine-vault/vault-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  allergyRecords,
  medicalRecords,
  medicines,
  members,
  visitPreparations,
} from "@/features/medicine-vault/data"

const quickActions = [
  { href: "/members", label: "管理成员档案", icon: UsersIcon },
  { href: "/records", label: "录入病历记录", icon: FilePlus2Icon },
  { href: "/medicines", label: "维护药品库", icon: PillIcon },
  { href: "/visit-prep", label: "生成就医清单", icon: ClipboardListIcon },
]

const statCards = [
  {
    label: "家庭成员",
    value: members.length,
    description: "已建立健康档案",
    icon: UsersIcon,
    tone: "text-sky-500 bg-sky-50 border-sky-100",
  },
  {
    label: "病历记录",
    value: medicalRecords.length,
    description: "按时间线整理",
    icon: StethoscopeIcon,
    tone: "text-emerald-500 bg-emerald-50 border-emerald-100",
  },
  {
    label: "药品条目",
    value: medicines.length,
    description: "含有效期状态",
    icon: PillIcon,
    tone: "text-violet-500 bg-violet-50 border-violet-100",
  },
  {
    label: "过敏记录",
    value: allergyRecords.length,
    description: "就医前优先提示",
    icon: ShieldAlertIcon,
    tone: "text-rose-500 bg-rose-50 border-rose-100",
  },
] as const

export default function Home() {
  const latestRecord = medicalRecords.toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))[0]
  const activePreparation = visitPreparations[0]

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">健康资料工作台</h1>
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 hover:bg-emerald-50">
                  MVP 原型
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                集中管理病历、药品、过敏史和就医前资料，让 AI 先做资料整理，不替代医生判断。
              </p>
            </div>

            <Button asChild className="rounded-2xl bg-emerald-500 px-4 text-white shadow-sm hover:bg-emerald-600">
              <Link href="/visit-prep">
                <ClipboardListIcon data-icon="inline-start" />
                就医准备
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
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">下一步建议</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">先把资料结构跑通</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
                  <SparklesIcon className="size-5" aria-hidden="true" />
                </span>
              </div>

              <p className="text-sm leading-7 text-slate-600">
                当前版本使用 mock 数据验证产品信息架构。数据库、真实 AI 和文件上传会在页面流程稳定后接入。
              </p>

              <div className="grid gap-3">
                {quickActions.map((action) => (
                  <Link
                    className="flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    href={action.href}
                    key={action.href}
                  >
                    <span className="inline-flex items-center gap-2">
                      <action.icon aria-hidden="true" className="size-4 text-emerald-500" />
                      {action.label}
                    </span>
                    <ArrowRightIcon aria-hidden="true" className="size-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <VaultPreview />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-3 p-5 text-sm leading-6">
              <p className="text-sm font-medium text-slate-500">最近病历</p>
              <p className="text-xl font-semibold text-slate-950">{latestRecord.diagnosis}</p>
              <p className="text-slate-600">{latestRecord.symptoms}</p>
              <p className="text-slate-600">{latestRecord.doctorAdvice}</p>
              <Badge className="w-fit rounded-full px-3 py-1" variant="secondary">
                {latestRecord.visitedAt} / {latestRecord.department}
              </Badge>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-4 p-5 text-sm leading-6">
              <p className="text-sm font-medium text-slate-500">就医准备</p>
              <p className="text-xl font-semibold text-slate-950">{activePreparation.concern}</p>
              <p className="text-slate-600">{activePreparation.summary}</p>
              <div className="flex items-start gap-2 rounded-[20px] border border-amber-100 bg-amber-50/70 p-4 text-slate-700">
                <ShieldAlertIcon className="mt-0.5 size-4 text-amber-500" aria-hidden="true" />
                <span>AI 输出仅用于资料整理，医疗判断需要医生或药师确认。</span>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </div>
  )
}
