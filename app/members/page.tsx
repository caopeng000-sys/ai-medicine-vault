import {
  CalendarIcon,
  ChevronRightIcon,
  FileTextIcon,
  PillIcon,
  SearchIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { MemberDeleteButton } from "@/components/medicine-vault/member-delete-button"
import { MockEntryDialog } from "@/components/medicine-vault/mock-entry-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  listAllergyRecords,
  listMedicalRecords,
  listMembers,
  listMedicines,
} from "@/features/medicine-vault/repository"

export default async function MembersPage() {
  const [members, medicalRecords, medicines, allergies] = await Promise.all([
    listMembers(),
    listMedicalRecords(),
    listMedicines(),
    listAllergyRecords(),
  ])

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">成员管理</h1>
                <Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-600 hover:bg-sky-50">
                  {members.length} 位成员
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                以个人和家庭成员为中心组织病历、药品、过敏信息和就医准备材料。
              </p>
            </div>

            <MockEntryDialog
              description="先验证成员录入信息的完整性，后续再接真实数据存储。"
              fields={[
                { label: "成员姓名", name: "name", placeholder: "例如：爸爸" },
                { label: "关系", name: "relationship", placeholder: "例如：父亲" },
                {
                  label: "性别",
                  name: "gender",
                  placeholder: "请选择性别",
                  type: "select",
                  options: [
                    { label: "男", value: "男" },
                    { label: "女", value: "女" },
                  ],
                },
                { label: "出生年份", name: "birthYear", placeholder: "例如：1970" },
                {
                  label: "健康备注",
                  name: "note",
                  placeholder: "记录需要长期关注的症状、慢病或就医提醒。",
                  type: "textarea",
                },
              ]}
              endpoint="/api/members"
              submitLabel="保存成员"
              title="新增成员原型"
              triggerLabel="新增成员"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <UsersIcon className="size-4 text-sky-500" aria-hidden="true" />
                成员档案
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{members.length}</p>
              <p className="mt-1 text-sm text-slate-500">支持本人和家庭成员分开管理。</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <FileTextIcon className="size-4" aria-hidden="true" />
                已关联病历
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {medicalRecords.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">用于查看每位成员的历史问诊背景。</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-rose-700">
                <ShieldAlertIcon className="size-4" aria-hidden="true" />
                风险提示
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {allergies.length}
              </p>
              <p className="mt-1 text-sm text-slate-500">后续将作为全局提醒在多个页面复用。</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
            <Input
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="搜索成员姓名、关系或健康备注..."
            />
          </div>
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          {members.map((member) => {
            const records = medicalRecords.filter((record) => record.memberId === member.id)
            const memberMedicines = medicines.filter((item) => item.memberId === member.id)
            const memberAllergies = allergies.filter((item) => item.memberId === member.id)

            return (
              <Card
                className="overflow-hidden rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]"
                key={member.id}
              >
                <CardContent className="grid gap-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">
                        {member.relationship} / {member.gender}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-slate-950">{member.name}</p>
                    </div>
                    <Badge className="rounded-full px-3 py-1" variant="outline">
                      {member.birthYear}
                    </Badge>
                  </div>

                  <p className="text-sm leading-6 text-slate-600">{member.note}</p>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50/70 px-3 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <FileTextIcon className="size-4 text-sky-500" aria-hidden="true" />
                        病历
                      </span>
                      <strong>{records.length}</strong>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50/70 px-3 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <PillIcon className="size-4 text-violet-500" aria-hidden="true" />
                        药品
                      </span>
                      <strong>{memberMedicines.length}</strong>
                    </div>
                    <div className="flex items-center justify-between rounded-[18px] border border-slate-100 bg-slate-50/70 px-3 py-3">
                      <span className="inline-flex items-center gap-2 text-slate-700">
                        <ShieldAlertIcon className="size-4 text-rose-500" aria-hidden="true" />
                        过敏
                      </span>
                      <strong>{memberAllergies.length}</strong>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-amber-100 bg-amber-50/70 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <CalendarIcon className="size-4 text-amber-500" aria-hidden="true" />
                      过敏摘要
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{member.allergySummary}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MockEntryDialog
                      description="更新成员姓名、关系和备注，便于后续按成员归档病历与药品。"
                      endpoint={`/api/members/${member.id}`}
                      fields={[
                        { label: "成员姓名", name: "name", placeholder: "例如：爸爸" },
                        { label: "关系", name: "relationship", placeholder: "例如：父亲" },
                        {
                          label: "性别",
                          name: "gender",
                          placeholder: "请选择性别",
                          type: "select",
                          options: [
                            { label: "男", value: "男" },
                            { label: "女", value: "女" },
                          ],
                        },
                        { label: "出生年份", name: "birthYear", placeholder: "例如：1970" },
                        {
                          label: "健康备注",
                          name: "note",
                          placeholder: "记录需要长期关注的症状、慢病或就医提醒。",
                          type: "textarea",
                        },
                      ]}
                      initialValues={{
                        name: member.name,
                        relationship: member.relationship,
                        gender: member.gender,
                        birthYear: member.birthYear,
                        note: member.note,
                      }}
                      method="PATCH"
                      submitLabel="保存修改"
                      title="编辑成员"
                      triggerClassName="flex-1 rounded-xl"
                      triggerLabel="编辑"
                    />
                    <MemberDeleteButton
                      className="flex-1 rounded-xl"
                      memberId={member.id}
                      memberName={member.name}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild className="flex-1 rounded-xl" variant="outline">
                      <Link href={`/members/${member.id}`}>查看详情</Link>
                    </Button>
                    <Button asChild className="flex-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                      <Link href={`/records?member=${member.id}`}>
                        查看病历
                        <ChevronRightIcon data-icon="inline-end" />
                      </Link>
                    </Button>
                  </div>

                  <p className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <Trash2Icon className="size-3.5" aria-hidden="true" />
                    删除成员会一并删除关联病历、药品、过敏和就医准备记录。
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </section>
      </section>
    </div>
  )
}
