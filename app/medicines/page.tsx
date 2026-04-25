import {
  CalendarClockIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  Clock3Icon,
  MapPinIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { MockEntryDialog } from "@/components/medicine-vault/mock-entry-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getMedicineStatus, getMemberById, medicines, members } from "@/features/medicine-vault/data"

const filterButtons = ["全部状态", "全部分类", "过期日期"]

const accentStyles = [
  "bg-sky-50 text-sky-600 ring-sky-100",
  "bg-blue-50 text-blue-600 ring-blue-100",
  "bg-amber-50 text-amber-600 ring-amber-100",
  "bg-emerald-50 text-emerald-600 ring-emerald-100",
  "bg-violet-50 text-violet-600 ring-violet-100",
  "bg-rose-50 text-rose-600 ring-rose-100",
] as const

export default async function MedicinesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ member?: string }>
}>) {
  const { member } = await searchParams
  const currentMember = member ? getMemberById(member) : undefined
  const visibleMedicines = medicines.filter((item) => (member ? item.memberId === member : true))
  const countLabel = `${visibleMedicines.length} 条药品记录`
  const expiringSoonCount = visibleMedicines.filter((item) => {
    const status = getMedicineStatus(item.expiresAt)
    return status.daysLeft >= 0 && status.daysLeft <= 60
  }).length
  const expiredCount = visibleMedicines.filter((item) => getMedicineStatus(item.expiresAt).daysLeft < 0).length

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">药物管理</h1>
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 hover:bg-emerald-50">
                  {countLabel}
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                {currentMember
                  ? `当前聚焦 ${currentMember.name} 的家庭用药记录，优先展示有效期、用途和就医时需要说明的上下文。`
                  : "按药品库方式整理常备药、家庭设备耗材和既往剩余处方，先做资料管理，不做替代用药推荐。"}
              </p>
            </div>

            <Button className="rounded-2xl bg-emerald-500 px-4 text-white shadow-sm hover:bg-emerald-600">
              <PlusIcon aria-hidden="true" data-icon="inline-start" />
              新增药物记录
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <PackageIcon className="size-4 text-emerald-500" aria-hidden="true" />
                药品库总量
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{visibleMedicines.length}</p>
              <p className="mt-1 text-sm text-slate-500">覆盖常备药、设备耗材和既往剩余处方。</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                <Clock3Icon className="size-4" aria-hidden="true" />
                即将过期
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{expiringSoonCount}</p>
              <p className="mt-1 text-sm text-slate-500">建议优先检查存放位置和下次复诊是否仍需保留。</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-700">
                <TriangleAlertIcon className="size-4" aria-hidden="true" />
                已过期
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{expiredCount}</p>
              <p className="mt-1 text-sm text-slate-500">过期药品应尽快处理，不继续作为家庭备药保留。</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
                <Input
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  placeholder="搜索药品名称、成分、用途..."
                />
              </div>

              {filterButtons.map((label) => (
                <Button
                  className="justify-between rounded-2xl border-slate-200 bg-white px-4 text-slate-600 hover:bg-slate-50"
                  key={label}
                  variant="outline"
                >
                  {label}
                  <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full px-3 py-1" variant={currentMember ? "outline" : "secondary"}>
                全部成员
              </Badge>
              {members.map((item) => (
                <Badge
                  className="rounded-full px-3 py-1"
                  key={item.id}
                  variant={currentMember?.id === item.id ? "secondary" : "outline"}
                >
                  {item.name}
                </Badge>
              ))}
              <MockEntryDialog
                description="先把药品录入表单做成高完成度原型，后续再接真实存储与筛选联动。"
                fields={[
                  { label: "药品名称", name: "name", placeholder: "例如：阿莫西林胶囊" },
                  { label: "分类", name: "category", placeholder: "例如：抗感染" },
                  { label: "剂量", name: "dosage", placeholder: "例如：0.25g/粒" },
                  { label: "规格", name: "specification", placeholder: "例如：0.25g * 24 粒" },
                  { label: "有效期", name: "expiresAt", placeholder: "例如：2027-01-31" },
                  {
                    label: "使用说明",
                    name: "instructions",
                    placeholder: "记录服用方式、频率或特别提醒。",
                    type: "textarea",
                  },
                ]}
                submitLabel="保存药品原型"
                title="新增药品记录"
                triggerLabel="录入药品"
              />
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {visibleMedicines.map((medicine, index) => {
            const member = getMemberById(medicine.memberId)
            const status = getMedicineStatus(medicine.expiresAt)
            const accent = accentStyles[index % accentStyles.length]
            const expiryTone =
              status.daysLeft < 0
                ? "bg-rose-50 text-rose-500"
                : status.daysLeft <= 60
                  ? "bg-amber-50 text-amber-500"
                  : "bg-emerald-50 text-emerald-600"

            return (
              <Card
                className="overflow-hidden rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]"
                key={medicine.id}
              >
                <CardContent className="grid gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${accent}`}
                      >
                        <PackageIcon className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-slate-950">{medicine.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {member?.name ?? "未关联成员"} · {medicine.category}
                        </p>
                      </div>
                    </div>

                    <Badge
                      className="shrink-0 rounded-full px-2.5 py-1 text-xs"
                      variant={status.tone}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  <div className="grid gap-4 text-sm leading-6 text-slate-600">
                    <div className="grid gap-1">
                      <p className="text-xs font-medium tracking-wide text-slate-400">剂量</p>
                      <p>{medicine.dosage}</p>
                    </div>

                    <div className="grid gap-1">
                      <p className="text-xs font-medium tracking-wide text-slate-400">使用说明</p>
                      <p>{medicine.instructions}</p>
                    </div>

                    <div className="grid gap-1">
                      <p className="text-xs font-medium tracking-wide text-slate-400">用途</p>
                      <p>{medicine.purpose}</p>
                    </div>

                    <div className="grid gap-2">
                      <p className="text-xs font-medium tracking-wide text-slate-400">过期日期</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 text-slate-700">
                          <CalendarClockIcon className="size-4 text-slate-400" aria-hidden="true" />
                          {medicine.expiresAt}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${expiryTone}`}>
                          {status.daysLeft < 0 ? `已过期 ${Math.abs(status.daysLeft)} 天` : `距离过期 ${status.daysLeft} 天`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[20px] bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-700">存放位置</p>
                        <p className="mt-1">{medicine.storageLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ClipboardListIcon className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-700">补充说明</p>
                        <p className="mt-1">{medicine.usageNote}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ShieldAlertIcon className="mt-0.5 size-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-700">安全提醒</p>
                        <p className="mt-1">{medicine.safetyNote}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <footer className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>共 {visibleMedicines.length} 条记录</p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button className="size-9 rounded-xl" size="icon" variant="outline">
                <ChevronLeftIcon className="size-4" aria-hidden="true" />
              </Button>
              <Button className="size-9 rounded-xl border-blue-200 bg-blue-50 text-blue-600" size="icon" variant="outline">
                1
              </Button>
              <Button className="size-9 rounded-xl" size="icon" variant="outline">
                2
              </Button>
              <Button className="size-9 rounded-xl" size="icon" variant="outline">
                <ChevronRightIcon className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <Button className="rounded-xl px-3 text-slate-600" variant="outline">
              12 条/页
              <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        </footer>
      </section>
    </div>
  )
}
