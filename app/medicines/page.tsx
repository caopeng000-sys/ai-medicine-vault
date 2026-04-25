import { MapPinIcon, PackageIcon } from "lucide-react"

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
import { getMedicineStatus, getMemberById, medicines, members } from "@/features/medicine-vault/data"

export default async function MedicinesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ member?: string }>
}>) {
  const { member } = await searchParams
  const currentMember = member ? getMemberById(member) : undefined
  const visibleMedicines = medicines.filter((item) => (member ? item.memberId === member : true))

  return (
    <div>
      <PageHeader
        action={
          <MockEntryDialog
            description="先验证药品录入字段是否顺手，当前提交只用于原型展示。"
            fields={[
              { label: "药品名称", name: "name", placeholder: "例如：阿莫西林胶囊" },
              { label: "规格", name: "specification", placeholder: "例如：0.25g * 24 粒" },
              { label: "数量", name: "quantity", placeholder: "例如：2 盒" },
              { label: "有效期", name: "expiresAt", placeholder: "例如：2027-01-31" },
              { label: "存放位置", name: "storageLocation", placeholder: "例如：厨房上柜药箱" },
              {
                label: "使用备注",
                name: "usageNote",
                placeholder: "记录适用症状、使用提醒和需要确认的问题。",
                type: "textarea",
              },
            ]}
            title="录入药品原型"
            triggerLabel="录入药品"
          />
        }
        description={
          currentMember
            ? `当前只展示 ${currentMember.name} 关联的药品。页面只做信息整理，不推荐替代药品。`
            : "管理家庭常备药、有效期、存放位置和注意事项。页面只做信息整理，不推荐替代药品。"
        }
        title="药品管理"
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
        {visibleMedicines.map((medicine) => {
          const member = getMemberById(medicine.memberId)
          const status = getMedicineStatus(medicine.expiresAt)

          return (
            <Card key={medicine.id}>
              <CardHeader>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <Badge variant={status.tone}>{status.label}</Badge>
                  <span>{member?.name ?? "未关联成员"}</span>
                </CardDescription>
                <CardTitle>{medicine.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm leading-6">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="inline-flex items-center gap-2 font-medium">
                      <PackageIcon className="size-4 text-primary" aria-hidden="true" />
                      规格与数量
                    </p>
                    <p className="mt-2 text-muted-foreground">
                      {medicine.specification} / {medicine.quantity}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="inline-flex items-center gap-2 font-medium">
                      <MapPinIcon className="size-4 text-primary" aria-hidden="true" />
                      存放位置
                    </p>
                    <p className="mt-2 text-muted-foreground">{medicine.storageLocation}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium">有效期</p>
                  <p className="mt-2 text-muted-foreground">
                    {medicine.expiresAt}，距离参考日期还有 {status.daysLeft} 天。
                  </p>
                </div>
                <div>
                  <p className="font-medium">使用备注</p>
                  <p className="mt-2 text-muted-foreground">{medicine.usageNote}</p>
                  <p className="mt-1 text-muted-foreground">{medicine.safetyNote}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
