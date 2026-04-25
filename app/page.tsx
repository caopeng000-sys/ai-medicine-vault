import { ArrowRightIcon, FilePlus2Icon, PillIcon } from "lucide-react"

import { VaultPreview } from "@/components/medicine-vault/vault-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,var(--background)_0%,oklch(0.96_0.017_210)_48%,oklch(0.98_0.012_80)_100%)]">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-5 py-10 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-16">
        <div className="grid gap-6">
          <Badge className="w-fit" variant="outline">
            MediVault AI
          </Badge>
          <div className="grid gap-5">
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-balance sm:text-5xl lg:text-6xl">
              面向个人健康知识库的 AI 药品收集管理平台。
            </h1>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              把病历、用药记录、家中药品和个人知识库放在一个地方。生病时先快速回看自己的历史记录，
              再整理出可以带给医生或药师确认的问题清单。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">
              <FilePlus2Icon data-icon="inline-start" />
              新增病历
            </Button>
            <Button size="lg" variant="outline">
              <PillIcon data-icon="inline-start" />
              录入药品
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <ArrowRightIcon className="size-4 text-primary" aria-hidden="true" />
              Server Component first
            </span>
            <span>shadcn/ui component system</span>
            <span>Tailwind v4 semantic tokens</span>
          </div>
        </div>

        <VaultPreview />
      </section>
    </main>
  )
}
