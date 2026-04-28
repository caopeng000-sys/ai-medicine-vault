import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  PlusIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { MockEntryDialog } from "@/components/medicine-vault/mock-entry-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { getMemberById, listAllergyRecords, listMembers } from "@/features/medicine-vault/repository"

const severityVariant = {
  轻微: "secondary",
  中等: "outline",
  严重: "destructive",
} as const

const filterButtons = ["全部风险等级", "全部过敏原", "发现时间"]

export const dynamic = "force-dynamic"

export default async function AllergiesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ member?: string }>
}>) {
  const { member } = await searchParams
  const ctx = await requireCurrentUser()
  const [members, visibleAllergies, currentMember] = await Promise.all([
    listMembers(ctx),
    listAllergyRecords(ctx, member),
    member ? getMemberById(ctx, member) : Promise.resolve(undefined),
  ])

  const severeCount = visibleAllergies.filter((item) => item.severity === "严重").length
  const monitoredCount = visibleAllergies.filter((item) => item.severity !== "轻微").length

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">过敏记录</h1>
                <Badge className="rounded-full bg-rose-50 px-3 py-1 text-rose-600 hover:bg-rose-50">
                  {visibleAllergies.length} 条风险记录
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                {currentMember
                  ? `当前聚焦 ${currentMember.name} 的过敏和不良反应记录，便于就医前快速提示医生。`
                  : "集中维护家庭成员的过敏原、反应表现和风险等级，就医、购药和问诊前优先展示。"}
              </p>
            </div>

            <MockEntryDialog
              description="先验证过敏记录字段和提交流程，后续会接入成员档案与风险提示。"
              fields={[
                { label: "过敏原", name: "allergen", placeholder: "例如：青霉素" },
                { label: "发现时间", name: "discoveredAt", placeholder: "例如：2026-04-25" },
                { label: "严重程度", name: "severity", placeholder: "例如：中等" },
                {
                  label: "反应描述",
                  name: "reaction",
                  placeholder: "例如：服用后出现皮疹、瘙痒或呼吸不适。",
                  type: "textarea",
                },
                {
                  label: "补充备注",
                  name: "note",
                  placeholder: "记录是否已就医确认、是否需要继续观察。",
                  type: "textarea",
                },
              ]}
              endpoint="/api/allergies"
              payload={{ memberId: currentMember?.id ?? members[0]?.id ?? "" }}
              submitLabel="保存过敏记录"
              title="新增过敏记录原型"
              triggerLabel="新增过敏记录"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <ShieldCheckIcon className="size-4 text-sky-500" aria-hidden="true" />
                风险档案总量
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{visibleAllergies.length}</p>
              <p className="mt-1 text-sm text-slate-500">用于就医前主动告知和历史记录追溯。</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                <TriangleAlertIcon className="size-4" aria-hidden="true" />
                重点监测
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{monitoredCount}</p>
              <p className="mt-1 text-sm text-slate-500">中等及以上风险应在每次问诊和购药前优先确认。</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-700">
                <ShieldAlertIcon className="size-4" aria-hidden="true" />
                高风险条目
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{severeCount}</p>
              <p className="mt-1 text-sm text-slate-500">高风险项目需要在后续版本中做更醒目的全局提醒。</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
                <Input
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  placeholder="搜索过敏原、反应、备注..."
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
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {visibleAllergies.map((record) => {
            const owner = members.find((item) => item.id === record.memberId)

            return (
              <Card
                className="overflow-hidden rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]"
                key={record.id}
              >
                <CardContent className="grid gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full px-3 py-1" variant={severityVariant[record.severity]}>
                          {record.severity}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1" variant="outline">
                          {owner?.name ?? "未知成员"}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1" variant="outline">
                          {record.discoveredAt}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xl font-semibold text-slate-950">{record.allergen}</p>
                        <p className="mt-1 text-sm text-slate-500">就医、购药和 AI 摘要中应优先作为风险上下文。</p>
                      </div>
                    </div>

                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                      <ShieldAlertIcon className="size-5" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <TriangleAlertIcon className="size-4 text-rose-500" aria-hidden="true" />
                        反应描述
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{record.reaction}</p>
                    </div>

                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ClipboardListIcon className="size-4 text-sky-500" aria-hidden="true" />
                        补充备注
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{record.note}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <footer className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>共 {visibleAllergies.length} 条记录</p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Button className="size-9 rounded-xl" size="icon" variant="outline">
                <ChevronLeftIcon className="size-4" aria-hidden="true" />
              </Button>
              <Button className="size-9 rounded-xl border-blue-200 bg-blue-50 text-blue-600" size="icon" variant="outline">
                1
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
