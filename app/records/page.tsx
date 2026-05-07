import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileTextIcon,
  HospitalIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  StethoscopeIcon,
  SyringeIcon,
} from "lucide-react"

import { MockEntryDialog } from "@/components/medicine-vault/mock-entry-dialog"
import { RecordAttachmentDeleteButton } from "@/components/medicine-vault/record-attachment-delete-button"
import { RecordAttachmentUploadDialog } from "@/components/medicine-vault/record-attachment-upload-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { getMemberById, listMedicalRecords, listMembers } from "@/features/medicine-vault/repository"

const filterButtons = ["全部时间", "全部科室", "全部诊断"]

export const dynamic = "force-dynamic"

export default async function RecordsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ member?: string }>
}>) {
  const { member } = await searchParams
  const ctx = await requireCurrentUser()
  const [members, records, currentMember] = await Promise.all([
    listMembers(ctx),
    listMedicalRecords(ctx, member),
    member ? getMemberById(ctx, member) : Promise.resolve(undefined),
  ])

  const departments = new Set(records.map((record) => record.department)).size
  const latestVisitedAt = records[0]?.visitedAt ?? "暂无记录"
  const attachmentCount = records.reduce((total, record) => total + (record.attachments?.length ?? 0), 0)

  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">病历记录</h1>
                <Badge className="rounded-full bg-sky-50 px-3 py-1 text-sky-600 hover:bg-sky-50">
                  {records.length} 条就诊记录
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                {currentMember
                  ? `当前聚焦 ${currentMember.name} 的就诊时间线，优先保留症状、诊断、医生建议和处方备注。`
                  : "按时间线整理家庭成员的就诊记录，为复诊、问诊准备和健康资料留档提供统一入口。"}
              </p>
            </div>

            <MockEntryDialog
              description="先把病历录入流程做成可点击原型，后续再接数据库和成员关联。"
              fields={[
                { label: "就诊日期", name: "visitedAt", placeholder: "例如：2026-04-25" },
                { label: "医院与科室", name: "hospital", placeholder: "例如：市立医院 / 呼吸科" },
                { label: "诊断结论", name: "diagnosis", placeholder: "例如：上呼吸道感染倾向" },
                {
                  label: "诊疗摘要",
                  name: "clinicalSummary",
                  placeholder: "例如：短期低烧合并咳嗽，对症处理为主。",
                  type: "textarea",
                },
                {
                  label: "检查/检验结果",
                  name: "examinationResults",
                  placeholder: "例如：体温 38℃，血常规提示轻度炎症。",
                  type: "textarea",
                },
                { label: "复诊时间", name: "followUpAt", placeholder: "例如：2026-05-01" },
                {
                  label: "症状描述",
                  name: "symptoms",
                  placeholder: "记录就诊时的主要症状和持续时间。",
                  type: "textarea",
                },
                {
                  label: "医生建议",
                  name: "advice",
                  placeholder: "记录复诊建议、观察点和禁忌提醒。",
                  type: "textarea",
                },
            ]}
            endpoint="/api/records"
            payload={{ memberId: currentMember?.id ?? members[0]?.id ?? "" }}
            submitLabel="保存病历"
            title="新增病历原型"
            triggerLabel="新增病历"
          />
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <FileTextIcon className="size-4 text-sky-500" aria-hidden="true" />
                病历总量
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{records.length}</p>
              <p className="mt-1 text-sm text-slate-500">覆盖感冒复诊、慢病随访和儿童就诊记录。</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <HospitalIcon className="size-4" aria-hidden="true" />
                涉及科室
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{departments}</p>
              <p className="mt-1 text-sm text-slate-500">方便下次问诊时快速回想以往就诊路径和检查背景。</p>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-700">
                <CalendarDaysIcon className="size-4" aria-hidden="true" />
                最近就诊
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{latestVisitedAt}</p>
              <p className="mt-1 text-sm text-slate-500">作为 AI 摘要和就医准备清单的重要最近上下文。</p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-amber-700">
                <PaperclipIcon className="size-4" aria-hidden="true" />
                病历附件
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{attachmentCount}</p>
              <p className="mt-1 text-sm text-slate-500">处方单、检查报告和就诊资料会跟随病历归档。</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
                <Input
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  placeholder="搜索症状、诊断、医院、科室..."
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

          <div className="rounded-[22px] border border-sky-100 bg-sky-50/70 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
              <PaperclipIcon className="size-4" aria-hidden="true" />
              病历附件能力
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              上传入口会出现在每条病历卡片右侧。先新增一条病历后，就可以给这条病历上传检查报告、处方单、就诊照片或 PDF，并可在上传前使用 AI 摘要图片内容。
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <section className="mt-6 rounded-[26px] border border-dashed border-slate-200 bg-slate-50/75 p-8 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-sky-500 shadow-sm">
              <PaperclipIcon className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">还没有可挂附件的病历</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              附件必须归属于某一条病历。先点击右上角“新增病历”，保存成功后，病历卡片右侧会出现“上传附件”按钮。
            </p>
          </section>
        ) : (
        <section className="mt-6 grid gap-4">
          {records.map((record, index) => {
            const owner = members.find((item) => item.id === record.memberId)

            return (
              <Card
                className="overflow-hidden rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]"
                key={record.id}
              >
                <CardContent className="grid gap-5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="grid gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full px-3 py-1" variant="secondary">
                          {owner?.name ?? "未知成员"}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1" variant="outline">
                          {record.visitedAt}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1" variant="outline">
                          {record.department}
                        </Badge>
                        <Badge className="rounded-full px-3 py-1" variant="outline">
                          {record.followUpAt || "暂无复诊时间"}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xl font-semibold text-slate-950">{record.diagnosis}</p>
                        <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-500">
                          <HospitalIcon className="size-4 text-slate-400" aria-hidden="true" />
                          {record.hospitalName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 sm:flex-row lg:flex-col lg:items-end">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-700">时间线序号</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">#{String(index + 1).padStart(2, "0")}</p>
                      </div>
                      <RecordAttachmentUploadDialog recordId={record.id} />
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr_1fr_1fr]">
                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <StethoscopeIcon className="size-4 text-sky-500" aria-hidden="true" />
                        症状描述
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{record.symptoms}</p>
                    </div>

                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <ClipboardListIcon className="size-4 text-emerald-500" aria-hidden="true" />
                        医生建议
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{record.doctorAdvice}</p>
                    </div>

                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <FileTextIcon className="size-4 text-amber-500" aria-hidden="true" />
                        检查/检验结果
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {record.examinationResults || "暂无检查/检验结果。"}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <FileTextIcon className="size-4 text-violet-500" aria-hidden="true" />
                        诊疗摘要
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {record.clinicalSummary || "暂无诊疗摘要。"}
                      </p>
                    </div>

                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CalendarDaysIcon className="size-4 text-amber-500" aria-hidden="true" />
                        复诊时间
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{record.followUpAt || "暂无复诊时间。"}</p>
                    </div>

                    <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <SyringeIcon className="size-4 text-violet-500" aria-hidden="true" />
                        处方与备注
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{record.prescriptionNote}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{record.note}</p>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <PaperclipIcon className="size-4 text-sky-500" aria-hidden="true" />
                        附件归档
                      </p>
                      <Badge className="rounded-full px-3 py-1" variant="outline">
                        {record.attachments?.length ?? 0} 个附件
                      </Badge>
                    </div>

                    {record.attachments?.length ? (
                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {record.attachments.map((attachment) => (
                          <div
                            className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/40"
                            key={attachment.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <a
                                className="min-w-0 flex-1"
                                href={`/api/records/${record.id}/attachments/${attachment.id}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-slate-950">
                                  <PaperclipIcon className="size-4 shrink-0 text-sky-500" aria-hidden="true" />
                                  <span className="truncate">{attachment.fileName}</span>
                                </span>
                                <span className="mt-2 block text-slate-600">{attachment.kind}</span>
                                <span className="mt-1 block text-xs leading-5 text-slate-500">
                                  {attachment.note || "暂无备注"} · {attachment.createdAt}
                                </span>
                                {attachment.aiSummary ? (
                                  <span className="mt-3 block rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs leading-5 text-slate-600">
                                    <span className="font-semibold text-sky-700">
                                      AI 摘要{attachment.aiDocumentType ? ` · ${attachment.aiDocumentType}` : ""}
                                    </span>
                                    <span className="mt-1 block">{attachment.aiSummary}</span>
                                    {attachment.aiKeyFindings?.length ? (
                                      <span className="mt-1 block">重点：{attachment.aiKeyFindings.join("；")}</span>
                                    ) : null}
                                    {attachment.aiSuggestedFollowUp ? (
                                      <span className="mt-1 block">后续：{attachment.aiSuggestedFollowUp}</span>
                                    ) : null}
                                  </span>
                                ) : null}
                              </a>
                              <RecordAttachmentDeleteButton
                                attachmentId={attachment.id}
                                fileName={attachment.fileName}
                                recordId={record.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-6 text-slate-500">
                        当前病历还没有附件，可以上传处方单、检查报告或就诊照片。
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </section>
        )}

        <footer className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>共 {records.length} 条记录</p>

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
