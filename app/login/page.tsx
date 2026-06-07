import { HeartPulseIcon, LogInIcon } from "lucide-react"
import Link from "next/link"

import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

type LoginPageProps = Readonly<{
  searchParams: Promise<{
    callbackUrl?: string
  }>
}>

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl = "/" } = await searchParams
  const hasGitHubProvider = Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fcfd_0%,#eef7f8_52%,#f7fbfb_100%)] px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-white/80 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
            <HeartPulseIcon aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-lg font-semibold text-slate-950">MedRecord</p>
            <p className="text-sm text-slate-500">登录后访问家庭健康资料</p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {hasGitHubProvider ? (
            <form
              action={async () => {
                "use server"
                await signIn("github", { redirectTo: callbackUrl })
              }}
            >
              <Button className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800" type="submit">
                <LogInIcon aria-hidden="true" className="size-4" />
                使用 GitHub 登录
              </Button>
            </form>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              生产环境需要配置 <code className="font-mono text-xs">GITHUB_ID</code> 与{" "}
              <code className="font-mono text-xs">GITHUB_SECRET</code> 后才能登录。
            </div>
          )}

          <p className="text-center text-sm text-slate-500">
            本地开发环境未登录时会自动使用开发用户，无需配置 OAuth。
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link className="text-sm text-emerald-700 hover:text-emerald-800" href="/">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}
