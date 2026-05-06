"use client"

import { useMemo } from "react"
import {
  ArrowUpRightIcon,
  BellIcon,
  BotIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  FileTextIcon,
  HeartPulseIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  PillIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { ExperienceLinks } from "@/components/medicine-vault/experience-links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CurrentUser } from "@/features/medicine-vault/auth-context"
import { cn } from "@/lib/utils"

const primaryNavigation = [
  { href: "/", label: "首页", icon: LayoutDashboardIcon },
  { href: "/records", label: "病历记录", icon: FileTextIcon },
  { href: "/medicines", label: "用药管理", icon: PillIcon },
  { href: "/assistant", label: "就医助手", icon: BotIcon },
  { href: "/members", label: "健康档案", icon: UsersIcon },
]

const secondaryNavigation = [
  { href: "/visit-prep", label: "就医准备", icon: ClipboardListIcon },
  { href: "/allergies", label: "风险提醒", icon: ShieldAlertIcon },
]

const utilityNavigation = [
  { href: "/records", label: "数据分析", icon: LineChartIcon },
  { href: "/assistant", label: "系统设置", icon: SettingsIcon },
]

export function AppShell({
  children,
  currentUser,
}: Readonly<{
  children: ReactNode
  currentUser: CurrentUser | null
}>) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const onLoginPage = pathname === "/login"
  const activeUser = session?.user ?? currentUser
  const isAuthenticated = Boolean(session?.user?.id)
  const userInitials = useMemo(() => {
    const source = activeUser?.name?.trim() || activeUser?.email?.trim() || "用户"
    const parts = source.split(/\s+/).filter(Boolean)
    const initials = parts.length > 1 ? `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}` : source.slice(0, 2)
    return initials || "用"
  }, [activeUser?.email, activeUser?.name])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_52%,#f7fbfb_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1440px] lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-white/70 bg-white/82 px-4 py-5 backdrop-blur lg:flex lg:flex-col lg:border-r lg:border-b-0 lg:px-6 lg:py-7">
          <div className="flex items-center gap-3">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                <HeartPulseIcon aria-hidden="true" className="size-5" />
              </span>
              <span className="grid min-w-0">
                <span className="truncate text-[1.05rem] font-semibold text-slate-950">MedRecord</span>
                <span className="truncate text-xs text-slate-500">家庭健康资料台</span>
              </span>
            </Link>

            <Badge className="ml-auto rounded-full border-emerald-100 bg-emerald-50 px-2.5 py-1 text-emerald-600 lg:hidden" variant="outline">
              原型
            </Badge>
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:grid lg:gap-1 lg:overflow-visible lg:pb-0">
            {primaryNavigation.map((item) => {
              const active = pathname === item.href

              return (
                <Link
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all lg:w-full",
                    active
                      ? "bg-emerald-50 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.14)]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <item.icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-5 hidden lg:block">
            <p className="px-4 text-xs font-medium tracking-wide text-slate-400">辅助模块</p>
            <div className="mt-2 grid gap-1">
              {secondaryNavigation.map((item) => {
                const active = pathname === item.href

                return (
                  <Link
                    className={cn(
                      "inline-flex min-h-10 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-all",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <item.icon aria-hidden="true" className="size-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="mt-5 hidden lg:block">
            <p className="px-4 text-xs font-medium tracking-wide text-slate-400">更多功能</p>
            <div className="mt-2 grid gap-1">
              {utilityNavigation.map((item) => (
                <Link
                  className="inline-flex min-h-10 items-center gap-3 rounded-2xl px-4 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900"
                  href={item.href}
                  key={item.label}
                >
                  <item.icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 hidden lg:block lg:flex-1" />

          <div className="mt-6 hidden rounded-[28px] border border-slate-100 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f8ff_100%)] p-5 shadow-[0_14px_50px_rgba(15,23,42,0.06)] lg:block">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <SparklesIcon aria-hidden="true" className="size-6 text-emerald-500" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">MVP 原型阶段</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              先把病历、药品、过敏和就医准备的信息架构跑通，再逐步接入数据库与 AI。
            </p>
            <Button className="mt-4 w-full rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600">
              查看规划
            </Button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/76 px-5 py-4 backdrop-blur md:px-8 lg:px-10">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="grid min-w-0 flex-1 gap-3">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <SearchIcon className="size-4 text-slate-400" aria-hidden="true" />
                  <Input
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    placeholder="搜索药品、病历、成员或就医问题..."
                  />
                </div>

                <ExperienceLinks />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button className="rounded-2xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50" size="icon" variant="outline">
                    <BellIcon className="size-4" aria-hidden="true" />
                  </Button>
                  <Button className="rounded-2xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50" size="icon" variant="outline">
                    <HelpCircleIcon className="size-4" aria-hidden="true" />
                  </Button>
                </div>

                {status === "loading" ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      ...
                    </span>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900">正在读取会话</p>
                      <p className="text-xs text-slate-500">请稍等一下</p>
                    </div>
                  </div>
                ) : isAuthenticated ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 shadow-sm">
                    <span className="flex size-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
                      {userInitials}
                    </span>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900">{activeUser?.name ?? "已登录用户"}</p>
                      <p className="text-xs text-slate-500">{activeUser?.email ?? "当前会话已连接"}</p>
                    </div>
                    <Button
                      className="rounded-xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-100"
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void signOut({ callbackUrl: "/login" })
                      }}
                    >
                      退出登录
                    </Button>
                  </div>
                ) : (
                  <Link
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors",
                      onLoginPage ? "border-emerald-200 bg-emerald-50/80" : "hover:bg-slate-50",
                    )}
                    href="/login"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white">
                      {currentUser ? userInitials : "未"}
                    </span>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-slate-900">{onLoginPage ? "登录与会话" : currentUser ? currentUser.name : "未登录"}</p>
                      <p className="text-xs text-slate-500">{onLoginPage ? "查看 provider 配置说明" : currentUser ? currentUser.email ?? "开发体验模式" : "点击登录以使用真实会话"}</p>
                    </div>
                    {onLoginPage ? (
                      <ChevronDownIcon className="size-4 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <ArrowUpRightIcon className="size-4 text-slate-400" aria-hidden="true" />
                    )}
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="min-w-0 px-5 py-6 md:px-8 lg:px-10 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
