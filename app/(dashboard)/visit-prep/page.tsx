import { ClipboardListIcon, FileTextIcon, PillIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { VisitPrepToolbar } from "@/components/medicine-vault/visit-prep-toolbar"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMembers,
  listMedicines,
  listVisitPreparations,
} from "@/features/medicine-vault/repository"

export const dynamic = "force-dynamic"

export default async function VisitPreparationPage() {
  const ctx = await requireCurrentUser()
  const [members, visitPreparations, medicalRecords, medicines, allergies] = await Promise.all([
    listMembers(ctx),
    listVisitPreparations(ctx),
    listMedicalRecords(ctx),
    listMedicines(ctx),
    listAllergyRecords(ctx),
  ])
  const preparation = visitPreparations[0]
  const member = members.find((item) => item.id === preparation?.memberId) ?? members[0]
  const records = member ? medicalRecords.filter((record) => record.memberId === member.id) : []
  const memberMedicines = member ? medicines.filter((item) => item.memberId === member.id) : []
  const memberAllergies = member ? allergies.filter((item) => item.memberId === member.id) : []

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">就医准备清单</h1>
                <Badge className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600 hover:bg-emerald-50">
                  AI 生成
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                把病历、近期用药和过敏信息整理成就医前可读清单。生成结果会保存，便于复诊前反复查看。
              </p>
            </div>

            <VisitPrepToolbar
              defaultConcern={preparation?.concern ?? "咳嗽低烧复诊前准备"}
              defaultMemberId={member?.id ?? members[0]?.id ?? ""}
              members={members}
            />
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
              <p className="mt-3 text-3xl font-semibold text-slate-950">{memberMedicines.length}</p>
              <p className="mt-1 text-sm text-slate-500">便于就医时快速说明最近实际接触过的药物。</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-700">
                <ShieldAlertIcon className="size-4" aria-hidden="true" />
                过敏提示
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{memberAllergies.length}</p>
              <p className="mt-1 text-sm text-slate-500">问诊前必须优先确认并主动说明给医生。</p>
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-4 p-5 text-sm leading-6">
              <div>
                <p className="text-sm font-medium text-slate-500">当前成员</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{member?.name ?? "尚未选择成员"}</p>
              </div>

              <p className="text-slate-600">{member?.note ?? "等录入成员、病历、药品和过敏记录后，这里会生成针对性的就医准备说明。"}</p>

              <div className="rounded-[22px] border border-amber-100 bg-amber-50/70 p-4">
                <p className="font-medium text-slate-700">过敏摘要</p>
                <p className="mt-2 text-slate-600">{member?.allergySummary ?? "暂无过敏摘要。"}</p>
              </div>

              <div className="grid gap-2">
                <Badge className="w-fit rounded-full px-3 py-1" variant="secondary">
                  相关病历 {records.length}
                </Badge>
                <Badge className="w-fit rounded-full px-3 py-1" variant="secondary">
                  近期药品 {memberMedicines.length}
                </Badge>
                <Badge className="w-fit rounded-full px-3 py-1" variant={memberAllergies.length > 0 ? "outline" : "secondary"}>
                  过敏记录 {memberAllergies.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-5 p-5 text-sm leading-6">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <ClipboardListIcon className="size-4" aria-hidden="true" />
                  就医准备
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{preparation?.concern ?? "尚未生成就医准备清单"}</p>
              </div>

              <section className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="font-medium text-slate-700">摘要</p>
                <p className="mt-3 whitespace-pre-line text-slate-600">
                  {preparation?.summary ?? "选择成员并描述就医场景后，点击「重新生成摘要」即可生成清单。"}
                </p>
              </section>

              <section className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="font-medium text-slate-700">建议咨询医生或药师的问题</p>
                <ul className="mt-3 grid gap-2">
                  {(preparation?.questions ?? ["当前还没有可生成的问题清单。"]).map((question) => (
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
