import { BotIcon, MessageSquareTextIcon, ShieldCheckIcon } from "lucide-react"

import { PageHeader } from "@/components/medicine-vault/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const suggestedQuestions = [
  "我上次感冒是什么时候？",
  "家里有哪些退烧药？",
  "我之前对哪些药有过不适？",
  "下次看医生前应该准备哪些问题？",
]

export default function AssistantPage() {
  return (
    <div>
      <PageHeader
        description="第一版先验证 AI 助手体验，不接真实模型。AI 的定位是资料整理助手，不是医生。"
        title="AI 助手"
      />

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardDescription>推荐问题</CardDescription>
            <CardTitle>从已有记录开始问</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {suggestedQuestions.map((question) => (
              <div className="rounded-lg border bg-background px-4 py-3 text-sm font-medium" key={question}>
                {question}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardDescription className="inline-flex items-center gap-2">
              <BotIcon className="size-4" aria-hidden="true" />
              模拟回答
            </CardDescription>
            <CardTitle>下次看医生前应该准备哪些问题？</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm leading-6">
            <section className="rounded-lg border bg-background p-4">
              <p className="font-medium">摘要</p>
              <p className="mt-2 text-muted-foreground">
                根据 2026-04-12 的上呼吸道感染记录和 2026-03-08 的过敏性鼻炎记录，建议就医前整理咳嗽低烧持续时间、已使用药品、过敏史和近期鼻炎症状。
              </p>
            </section>

            <section>
              <p className="font-medium">依据记录</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">2026-04-12 感冒发热记录</Badge>
                <Badge variant="secondary">2026-03-08 过敏性鼻炎复诊</Badge>
                <Badge variant="outline">青霉素疑似过敏</Badge>
              </div>
            </section>

            <section>
              <p className="font-medium">待确认问题</p>
              <ul className="mt-3 grid gap-2">
                <li className="flex gap-2 rounded-lg border bg-background px-3 py-2">
                  <MessageSquareTextIcon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                  当前咳嗽低烧是否需要进一步检查？
                </li>
                <li className="flex gap-2 rounded-lg border bg-background px-3 py-2">
                  <MessageSquareTextIcon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
                  鼻炎史是否可能影响当前症状？
                </li>
              </ul>
            </section>

            <div className="flex items-start gap-3 rounded-lg border bg-primary/5 p-4">
              <ShieldCheckIcon className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <p className="text-muted-foreground">
                模拟回答仅用于产品原型展示。真实版本需要来源引用、安全模板和高风险问题收敛策略。
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
