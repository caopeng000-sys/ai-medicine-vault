import { CalendarDaysIcon, HospitalIcon } from "lucide-react"

import { MockEntryDialog } from "@/components/medicine-vault/mock-entry-dialog"
import { PageHeader } from "@/components/medicine-vault/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { getMemberById, medicalRecords, members } from "@/features/medicine-vault/data"

export default async function RecordsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ member?: string }>
}>) {
  const { member } = await searchParams
  const currentMember = member ? getMemberById(member) : undefined
  const records = medicalRecords
    .filter((record) => (member ? record.memberId === member : true))
    .toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))

  return (
    <div>
      <PageHeader
        action={
          <MockEntryDialog
            description="先把病历录入流程做成可点击原型，后续再接数据库和成员关联。"
            fields={[
              { label: "就诊日期", name: "visitedAt", placeholder: "例如：2026-04-25" },
              { label: "医院与科室", name: "hospital", placeholder: "例如：市立医院 / 呼吸科" },
              { label: "诊断结论", name: "diagnosis", placeholder: "例如：上呼吸道感染倾向" },
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
            title="新增病历原型"
            triggerLabel="新增病历"
          />
        }
        description={
          currentMember
            ? `当前只展示 ${currentMember.name} 的病历记录。`
            : "按时间线整理就诊记录、症状、诊断、医生建议和处方备注。"
        }
        title="病历记录"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant={currentMember ? "outline" : "secondary"}>全部成员</Badge>
        {members.map((item) => (
          <Badge key={item.id} variant={currentMember?.id === item.id ? "secondary" : "outline"}>
            {item.name}
          </Badge>
        ))}
      </div>

      <section className="grid gap-4">
        {records.map((record) => {
          const member = getMemberById(record.memberId)

          return (
            <Card key={record.id}>
              <CardHeader>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{member?.name ?? "未知成员"}</Badge>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDaysIcon className="size-4" aria-hidden="true" />
                    {record.visitedAt}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <HospitalIcon className="size-4" aria-hidden="true" />
                    {record.hospitalName} / {record.department}
                  </span>
                </CardDescription>
                <CardTitle>{record.diagnosis}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm leading-6">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4">
                    <p className="font-medium">症状描述</p>
                    <p className="mt-2 text-muted-foreground">{record.symptoms}</p>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <p className="font-medium">医生建议</p>
                    <p className="mt-2 text-muted-foreground">{record.doctorAdvice}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="font-medium">处方与备注</p>
                  <p className="mt-2 text-muted-foreground">{record.prescriptionNote}</p>
                  <p className="mt-1 text-muted-foreground">{record.note}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
