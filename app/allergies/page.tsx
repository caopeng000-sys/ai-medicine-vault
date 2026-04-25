import { ShieldAlertIcon } from "lucide-react"

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
import { allergyRecords, getMemberById, members } from "@/features/medicine-vault/data"

const severityVariant = {
  轻微: "secondary",
  中等: "outline",
  严重: "destructive",
} as const

export default async function AllergiesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ member?: string }>
}>) {
  const { member } = await searchParams
  const currentMember = member ? getMemberById(member) : undefined
  const visibleAllergies = allergyRecords.filter((item) => (member ? item.memberId === member : true))

  return (
    <div>
      <PageHeader
        action={
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
            title="新增过敏记录原型"
            triggerLabel="新增过敏记录"
          />
        }
        description={
          currentMember
            ? `当前只展示 ${currentMember.name} 的过敏记录。`
            : "集中记录过敏原、反应和严重程度，就医前优先提示。"
        }
        title="过敏记录"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge variant={currentMember ? "outline" : "secondary"}>全部成员</Badge>
        {members.map((item) => (
          <Badge key={item.id} variant={currentMember?.id === item.id ? "secondary" : "outline"}>
            {item.name}
          </Badge>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {visibleAllergies.map((record) => {
          const member = getMemberById(record.memberId)

          return (
            <Card className="border-primary/20" key={record.id}>
              <CardHeader>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <Badge variant={severityVariant[record.severity]}>{record.severity}</Badge>
                  <span>{member?.name ?? "未知成员"}</span>
                  <span>{record.discoveredAt}</span>
                </CardDescription>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlertIcon className="size-5 text-primary" aria-hidden="true" />
                  {record.allergen}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-6">
                <div className="rounded-lg border bg-background p-4">
                  <p className="font-medium">反应描述</p>
                  <p className="mt-2 text-muted-foreground">{record.reaction}</p>
                </div>
                <div>
                  <p className="font-medium">备注</p>
                  <p className="mt-2 text-muted-foreground">{record.note}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
