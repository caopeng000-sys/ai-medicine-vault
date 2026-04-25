import {
  ArrowRightIcon,
  ClipboardListIcon,
  FilePlus2Icon,
  PillIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { PageHeader } from "@/components/medicine-vault/page-header"
import { VaultPreview } from "@/components/medicine-vault/vault-preview"
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
  allergyRecords,
  medicalRecords,
  medicines,
  members,
  visitPreparations,
} from "@/features/medicine-vault/data"

const quickActions = [
  { href: "/members", label: "管理成员", icon: UsersIcon },
  { href: "/records", label: "新增病历", icon: FilePlus2Icon },
  { href: "/medicines", label: "录入药品", icon: PillIcon },
  { href: "/visit-prep", label: "生成就医清单", icon: ClipboardListIcon },
]

const statCards = [
  { label: "家庭成员", value: members.length, description: "已建立健康档案" },
  { label: "病历记录", value: medicalRecords.length, description: "按时间线整理" },
  { label: "药品条目", value: medicines.length, description: "含有效期状态" },
  { label: "过敏记录", value: allergyRecords.length, description: "就医前优先提示" },
]

export default function Home() {
  const latestRecord = medicalRecords.toSorted((a, b) => b.visitedAt.localeCompare(a.visitedAt))[0]
  const activePreparation = visitPreparations[0]

  return (
    <div className="grid gap-6">
      <PageHeader
        action={
          <Button asChild size="lg">
            <Link href="/visit-prep">
              <ClipboardListIcon data-icon="inline-start" />
              就医准备
            </Link>
          </Button>
        }
        description="集中管理病历、药品、过敏史和就医前资料，让 AI 先做资料整理，不替代医生判断。"
        title="健康资料工作台"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardDescription>下一步建议</CardDescription>
            <CardTitle>先把资料结构跑通</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm leading-7 text-muted-foreground">
              当前版本使用 mock 数据验证产品信息架构。数据库、真实 AI 和文件上传会在页面流程稳定后接入。
            </p>
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <Link
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  href={action.href}
                  key={action.href}
                >
                  <span className="inline-flex items-center gap-2">
                    <action.icon aria-hidden="true" className="size-4 text-primary" />
                    {action.label}
                  </span>
                  <ArrowRightIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <VaultPreview />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>最近病历</CardDescription>
            <CardTitle>{latestRecord.diagnosis}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>{latestRecord.symptoms}</p>
            <p>{latestRecord.doctorAdvice}</p>
            <Badge className="w-fit" variant="secondary">
              {latestRecord.visitedAt} / {latestRecord.department}
            </Badge>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardDescription>就医准备</CardDescription>
            <CardTitle>{activePreparation.concern}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
            <p>{activePreparation.summary}</p>
            <div className="flex items-start gap-2 rounded-lg border bg-background p-3 text-foreground">
              <ShieldAlertIcon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <span>AI 输出仅用于资料整理，医疗判断需要医生或药师确认。</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
