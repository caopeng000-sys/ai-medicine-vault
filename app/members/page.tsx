import { CalendarIcon, FileTextIcon, PillIcon, ShieldAlertIcon } from "lucide-react"
import Link from "next/link"

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
  getAllergiesForMember,
  getMedicinesForMember,
  getRecordsForMember,
  members,
} from "@/features/medicine-vault/data"

export default function MembersPage() {
  return (
    <div>
      <PageHeader
        action={
          <MockEntryDialog
            description="先验证成员录入信息的完整性，后续再接真实数据存储。"
            fields={[
              { label: "成员姓名", name: "name", placeholder: "例如：爸爸" },
              { label: "关系", name: "relationship", placeholder: "例如：父亲" },
              { label: "出生年份", name: "birthYear", placeholder: "例如：1970" },
              {
                label: "健康备注",
                name: "note",
                placeholder: "记录需要长期关注的症状、慢病或就医提醒。",
                type: "textarea",
              },
            ]}
            title="新增成员原型"
            triggerLabel="新增成员"
          />
        }
        description="以个人和家庭成员为中心组织病历、药品和过敏信息。"
        title="成员管理"
      />

      <section className="grid gap-4 xl:grid-cols-3">
        {members.map((member) => {
          const records = getRecordsForMember(member.id)
          const medicines = getMedicinesForMember(member.id)
          const allergies = getAllergiesForMember(member.id)

          return (
            <Card key={member.id}>
              <CardHeader>
                <CardDescription>{member.relationship}</CardDescription>
                <CardTitle className="flex items-center justify-between gap-3">
                  {member.name}
                  <Badge variant="outline">{member.birthYear}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <p className="text-sm leading-6 text-muted-foreground">{member.note}</p>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <FileTextIcon className="size-4 text-primary" aria-hidden="true" />
                      病历
                    </span>
                    <strong>{records.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <PillIcon className="size-4 text-primary" aria-hidden="true" />
                      药品
                    </span>
                    <strong>{medicines.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      <ShieldAlertIcon className="size-4 text-primary" aria-hidden="true" />
                      过敏
                    </span>
                    <strong>{allergies.length}</strong>
                  </div>
                </div>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <CalendarIcon className="size-4 text-primary" aria-hidden="true" />
                    过敏摘要
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{member.allergySummary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="flex-1" variant="outline">
                    <Link href={`/members/${member.id}`}>查看详情</Link>
                  </Button>
                  <Button asChild className="flex-1" variant="secondary">
                    <Link href={`/records?member=${member.id}`}>查看病历</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
