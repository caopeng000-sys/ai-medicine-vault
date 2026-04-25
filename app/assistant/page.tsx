import {
  ArrowUpRightIcon,
  BotIcon,
  ChevronRightIcon,
  FileTextIcon,
  MessageSquareTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const suggestedQuestions = [
  "我上次感冒是什么时候？",
  "家里有哪些退烧药？",
  "我之前对哪些药有过不适？",
  "下次看医生前应该准备哪些问题？",
]

const evidenceItems = [
  "2026-04-12 感冒发热记录",
  "2026-03-08 过敏性鼻炎复诊",
  "青霉素疑似过敏",
]

const followupQuestions = [
  "当前咳嗽低烧是否需要进一步检查？",
  "鼻炎史是否可能影响当前症状？",
  "已使用布洛芬后是否还需要额外说明？",
]

export default function AssistantPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_90px_rgba(15,23,42,0.08)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-slate-950">AI 助手</h1>
                <Badge className="rounded-full bg-violet-50 px-3 py-1 text-violet-600 hover:bg-violet-50">
                  原型问答模式
                </Badge>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                第一版先验证基于病历、药品和过敏档案的资料问答体验。AI 的角色是资料整理助手，不提供诊断和治疗建议。
              </p>
            </div>

            <Button className="rounded-2xl bg-violet-500 px-4 text-white shadow-sm hover:bg-violet-600">
              <SparklesIcon aria-hidden="true" data-icon="inline-start" />
              生成就医摘要
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <MessageSquareTextIcon className="size-4 text-violet-500" aria-hidden="true" />
                推荐问题
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{suggestedQuestions.length}</p>
              <p className="mt-1 text-sm text-slate-500">聚焦你最常会问的病历、药品和就医准备问题。</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/85 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                <FileTextIcon className="size-4" aria-hidden="true" />
                引用资料
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{evidenceItems.length}</p>
              <p className="mt-1 text-sm text-slate-500">真实版本中需要显示来源引用和时间戳，避免凭空生成。</p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-700">
                <ShieldCheckIcon className="size-4" aria-hidden="true" />
                安全边界
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">已收敛</p>
              <p className="mt-1 text-sm text-slate-500">当前只做资料总结、风险提示和待问问题，不输出治疗决策。</p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
            <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
            <Input
              className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
              placeholder="输入你的问题，例如：下次看医生前应该准备哪些问题？"
            />
            <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">发送</Button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">推荐问题</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">从已有记录开始问</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 ring-1 ring-violet-100">
                  <BotIcon className="size-5" aria-hidden="true" />
                </span>
              </div>

              <div className="grid gap-3">
                {suggestedQuestions.map((question) => (
                  <button
                    className="flex items-center justify-between rounded-[20px] border border-slate-100 bg-slate-50/70 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    key={question}
                    type="button"
                  >
                    <span>{question}</span>
                    <ChevronRightIcon className="size-4 text-slate-400" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-700">建议下一步</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  后续可以把推荐问题做成可点击切换右侧回答的交互，再接入真实的引用来源和问答状态。
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[26px] border-slate-100 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="grid gap-5 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-violet-600">
                    <BotIcon className="size-4" aria-hidden="true" />
                    模拟回答
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">下次看医生前应该准备哪些问题？</p>
                </div>
                <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-100">
                  资料整理模式
                </Badge>
              </div>

              <section className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-sm font-medium text-slate-700">摘要</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  根据 2026-04-12 的上呼吸道感染记录和 2026-03-08 的过敏性鼻炎记录，建议就医前整理咳嗽低烧持续时间、已使用药品、过敏史和近期鼻炎症状。
                </p>
              </section>

              <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-700">依据记录</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {evidenceItems.map((item) => (
                      <Badge className="rounded-full px-3 py-1" key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-[22px] border border-slate-100 bg-slate-50/70 p-4">
                  <p className="text-sm font-medium text-slate-700">待确认问题</p>
                  <ul className="mt-3 grid gap-2">
                    {followupQuestions.map((question) => (
                      <li className="flex gap-2 rounded-2xl bg-white px-3 py-3 text-sm text-slate-600" key={question}>
                        <ArrowUpRightIcon className="mt-0.5 size-4 text-violet-500" aria-hidden="true" />
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50/70 p-4">
                <ShieldCheckIcon className="mt-0.5 size-4 text-emerald-600" aria-hidden="true" />
                <p className="text-sm leading-6 text-slate-600">
                  当前回答仅用于产品原型展示。真实版本需要引用来源、风险模板、敏感问题收敛和人工复核策略。
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </div>
  )
}
