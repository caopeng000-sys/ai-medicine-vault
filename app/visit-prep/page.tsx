import { ClipboardListIcon, ShieldCheckIcon } from "lucide-react"

import { PageHeader } from "@/components/medicine-vault/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
    <div>
      <PageHeader
        description="把病历、近期用药和过敏信息整理成就医前可读清单。当前版本为 mock 数据生成。"
        title="就医准备清单"
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardDescription>当前成员</CardDescription>
            <CardTitle>{member.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm leading-6">
            <p className="text-muted-foreground">{member.note}</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="font-medium">过敏摘要</p>
              <p className="mt-2 text-muted-foreground">{member.allergySummary}</p>
            </div>
            <div className="grid gap-2">
              <Badge className="w-fit" variant="secondary">
                相关病历 {records.length}
              </Badge>
              <Badge className="w-fit" variant="secondary">
                近期药品 {medicines.length}
              </Badge>
              <Badge className="w-fit" variant={allergies.length > 0 ? "outline" : "secondary"}>
                过敏记录 {allergies.length}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardDescription className="inline-flex items-center gap-2">
              <ClipboardListIcon className="size-4" aria-hidden="true" />
              模拟生成
            </CardDescription>
            <CardTitle>{preparation.concern}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm leading-6">
            <section>
              <p className="font-medium">摘要</p>
              <p className="mt-2 text-muted-foreground">{preparation.summary}</p>
            </section>

            <section>
              <p className="font-medium">建议咨询医生或药师的问题</p>
              <ul className="mt-3 grid gap-2">
                {preparation.questions.map((question) => (
                  <li className="rounded-lg border bg-background px-3 py-2" key={question}>
                    {question}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex items-start gap-3 rounded-lg border bg-background p-4">
              <ShieldCheckIcon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <p className="text-muted-foreground">
                这份清单仅用于整理资料和沟通问题，不构成诊断或治疗建议。
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
