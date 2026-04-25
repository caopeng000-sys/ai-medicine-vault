import {
  BotIcon,
  ClipboardListIcon,
  FileTextIcon,
  HeartPulseIcon,
  LayoutDashboardIcon,
  PillIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const navigationItems = [
  { href: "/", label: "工作台", icon: LayoutDashboardIcon },
  { href: "/members", label: "成员", icon: UsersIcon },
  { href: "/records", label: "病历", icon: FileTextIcon },
  { href: "/medicines", label: "药品", icon: PillIcon },
  { href: "/allergies", label: "过敏", icon: ShieldAlertIcon },
  { href: "/visit-prep", label: "就医准备", icon: ClipboardListIcon },
  { href: "/assistant", label: "AI 助手", icon: BotIcon },
]

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--background)_0%,oklch(0.96_0.017_210)_48%,oklch(0.98_0.012_80)_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b bg-background/85 px-4 py-4 backdrop-blur lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="flex items-center gap-3 lg:flex-col lg:items-stretch">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HeartPulseIcon aria-hidden="true" />
              </span>
              <span className="grid min-w-0">
                <span className="truncate text-base font-semibold">AI Medicine Vault</span>
                <span className="truncate text-xs text-muted-foreground">个人健康知识库</span>
              </span>
            </Link>
            <Badge className="ml-auto lg:ml-0 lg:w-fit" variant="outline">
              MVP 原型
            </Badge>
          </div>

          <Separator className="my-4 hidden lg:block" />

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-0 lg:grid lg:overflow-visible lg:pb-0">
            {navigationItems.map((item) => (
              <Link
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:w-full"
                href={item.href}
                key={item.href}
              >
                <item.icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 hidden rounded-lg border bg-card p-4 text-sm leading-6 text-muted-foreground lg:block">
            当前阶段先用 mock 数据验证产品体验，不接真实医疗判断。
          </div>
        </aside>

        <main className="min-w-0 px-5 py-6 md:px-8 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
