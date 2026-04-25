import {
  CalendarDaysIcon,
  ChevronRightIcon,
  FileTextIcon,
  PillIcon,
  ShieldAlertIcon,
} from "lucide-react"
import Link from "next/link"

import { MemberDeleteButton } from "@/components/medicine-vault/member-delete-button"
import { MockEntryDialog } from "@/components/medicine-vault/mock-entry-dialog"
import { PageHeader } from "@/components/medicine-vault/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getMemberById,
  listAllergyRecords,
  listMedicines,
  listMedicalRecords,
  listVisitPreparations,
} from "@/features/medicine-vault/repository"

export default async function MemberDetailPage({
  params,
}: Readonly<{
  params: Promise<{ memberId: string }>
}>) {
  const { memberId } = await params
  const member = await getMemberById(memberId)

  if (!member) {
    return (
      <div>
        <PageHeader
          description="当前成员不存在或 mock 数据中还没有建立档案。"
          title="未找到成员"
        />
      </div>
    )
  }

  const [records, medicines, allergies, preparations] = await Promise.all([
    listMedicalRecords(memberId),
    listMedicines(memberId),
    listAllergyRecords(memberId),
    listVisitPreparations(memberId),
  ])
  const preparation = preparations[0]

  return (
    <div className="grid gap-6">
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <MockEntryDialog
              description="更新成员基础资料，后续所有病历、药品和过敏记录都会继续挂在这个成员下。"
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
              triggerLabel="编辑成员"
            />
            <MemberDeleteButton memberId={member.id} memberName={member.name} redirectToMembers />
            <Button asChild variant="outline">
              <Link href={`/records?member=${member.id}`}>病历</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/medicines?member=${member.id}`}>药品</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/allergies?member=${member.id}`}>过敏</Link>
            </Button>
          </div>
        }
        description={`${member.relationship} / ${member.birthYear} 年出生 / ${member.gender}`}
        title={member.name}
      />

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardDescription>成员概览</CardDescription>
            <CardTitle>健康资料摘要</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6">
            <p className="text-muted-foreground">{member.note}</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="font-medium">过敏摘要</p>
              <p className="mt-2 text-muted-foreground">{member.allergySummary}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border bg-background p-3">
                <p className="inline-flex items-center gap-2 font-medium">
                  <FileTextIcon className="size-4 text-primary" aria-hidden="true" />
                  病历
                </p>
                <p className="mt-2 text-2xl font-semibold">{records.length}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="inline-flex items-center gap-2 font-medium">
                  <PillIcon className="size-4 text-primary" aria-hidden="true" />
                  药品
                </p>
                <p className="mt-2 text-2xl font-semibold">{medicines.length}</p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="inline-flex items-center gap-2 font-medium">
                  <ShieldAlertIcon className="size-4 text-primary" aria-hidden="true" />
                  过敏
                </p>
                <p className="mt-2 text-2xl font-semibold">{allergies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardDescription>就医准备</CardDescription>
            <CardTitle>{preparation?.concern ?? "暂未生成清单"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6">
            <p className="text-muted-foreground">
              {preparation?.summary ?? "当前成员还没有配置就医准备摘要。"}
            </p>
            {preparation ? (
              <ul className="grid gap-2">
                {preparation.questions.map((question) => (
                  <li className="flex gap-2 rounded-lg border bg-background px-3 py-2" key={question}>
                    <ChevronRightIcon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                    {question}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardDescription>最近病历</CardDescription>
            <CardTitle>按时间倒序查看</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {records.map((record) => (
              <div className="rounded-lg border bg-background p-4" key={record.id}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="secondary">{record.visitedAt}</Badge>
                  <span className="text-muted-foreground">
                    {record.hospitalName} / {record.department}
                  </span>
                </div>
                <p className="mt-3 font-medium">{record.diagnosis}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{record.symptoms}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>风险提示</CardDescription>
            <CardTitle>过敏与近期用药</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6">
            <div>
              <p className="font-medium">过敏记录</p>
              <div className="mt-2 grid gap-2">
                {allergies.length > 0 ? (
                  allergies.map((item) => (
                    <div className="rounded-lg border bg-background p-3" key={item.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{item.allergen}</span>
                        <Badge variant={item.severity === "严重" ? "destructive" : "outline"}>
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{item.reaction}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border bg-background p-3 text-muted-foreground">暂无明确过敏记录。</p>
                )}
              </div>
            </div>

            <div>
              <p className="font-medium">近期药品</p>
              <div className="mt-2 grid gap-2">
                {medicines.map((item) => (
                  <div className="rounded-lg border bg-background p-3" key={item.id}>
                    <p>{item.name}</p>
                    <p className="mt-1 text-muted-foreground">{item.specification}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
