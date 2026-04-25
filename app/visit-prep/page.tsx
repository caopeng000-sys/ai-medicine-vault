import { ClipboardListIcon, FileTextIcon, PillIcon, ShieldAlertIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getAllergiesForMember,
  getMedicinesForMember,
  getRecordsForMember,
  members,
  visitPreparations,
} from "@/features/medicine-vault/data"

export default function VisitPreparationPage() {
  const preparation = visitPreparations[0]
  const member = members.find((item) => item.id === preparation.memberId) ?? members[0]
  const records = getRecordsForMember(member.id)
  const medicines = getMedicinesForMember(member.id)
  const allergies = getAllergiesForMember(member.id)

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">就医准备清单</h1>
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 hover:bg-emerald-50">
                  模拟生成
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                把病历、近期用药和过敏信息整理成就医前可读清单。当前版本为 mock 数据生成。
              </p>
            </div>

            <Button className="rounded-2xl bg-emerald-500 px-4 text-white shadow-sm hover:bg-emerald-600">
              <SparklesIcon data-icon="inline-start" />
              重新生成摘要
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <FileTextIcon className="size-4 text-sky-500" aria-hidden="true" />
                相关病历
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{records.length}</p>
              <p className="mt-1 text-sm text-slate-500">最近病历越完整，就医前摘要越准确。</p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                <PillIcon className="size-4" aria-hidden="true" />
                近期药品
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{medicines.length}</p>
              <p className="mt-1 text-sm text-slate-500">便于就医时快速说明最近实际接触过的药物。</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-700">
                <ShieldAlertIcon className="size-4" aria-hidden="true" />
                过敏提示
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{allergies.length}</p>
              <p className="mt-1 text-sm text-slate-500">问诊前必须优先确认并主动说明给医生。</p>
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-4 p-5 text-sm leading-6">
              <div>
                <p className="text-sm font-medium text-slate-500">当前成员</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{member.name}</p>
              </div>

              <p className="text-slate-600">{member.note}</p>

              <div className="rounded-[22px] border border-amber-100 bg-amber-50/70 p-4">
                <p className="font-medium text-slate-700">过敏摘要</p>
                <p className="mt-2 text-slate-600">{member.allergySummary}</p>
              </div>

              <div className="grid gap-2">
                <Badge className="w-fit rounded-full px-3 py-1" variant="secondary">
                  相关病历 {records.length}
                </Badge>
                <Badge className="w-fit rounded-full px-3 py-1" variant="secondary">
                  近期药品 {medicines.length}
                </Badge>
                <Badge className="w-fit rounded-full px-3 py-1" variant={allergies.length > 0 ? "outline" : "secondary"}>
                  过敏记录 {allergies.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-5 p-5 text-sm leading-6">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <ClipboardListIcon className="size-4" aria-hidden="true" />
                  模拟生成
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{preparation.concern}</p>
              </div>

              <section className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="font-medium text-slate-700">摘要</p>
                <p className="mt-3 text-slate-600">{preparation.summary}</p>
              </section>

              <section className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="font-medium text-slate-700">建议咨询医生或药师的问题</p>
                <ul className="mt-3 grid gap-2">
                  {preparation.questions.map((question) => (
                    <li className="rounded-2xl bg-white px-3 py-3 text-slate-600" key={question}>
                      {question}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                <ShieldCheckIcon className="mt-0.5 size-4 text-emerald-600" aria-hidden="true" />
                <p className="text-slate-600">
                  这份清单仅用于整理资料和沟通问题，不构成诊断或治疗建议。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </div>
  )
}
