import { ArrowRightIcon, DownloadIcon, KeyRoundIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"
import Link from "next/link"

import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"

type LoginPageProps = Readonly<{
  searchParams?: Promise<{
    from?: string
  }>
}>

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const redirectTo = params?.from?.startsWith("/") ? params.from : "/"
  const githubEnabled = Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)
  const isProduction = process.env.NODE_ENV === "production"

  return (
    <section className="mx-auto grid max-w-2xl gap-6 rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <ShieldCheckIcon className="size-6" aria-hidden="true" />
      </div>
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold text-slate-950">登录家庭健康资料台</h1>
        <p className="text-sm leading-6 text-slate-600">
          登录后才能访问成员、病历、药品图片和 AI 助手。系统会按账号隔离数据，避免不同用户之间互相看到健康资料；导出时也只会包含当前账号可见的内容。
        </p>
      </div>

      {githubEnabled ? (
        <div className="grid gap-4">
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo })
            }}
          >
            <Button className="h-12 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-800" type="submit">
              <KeyRoundIcon className="size-4" aria-hidden="true" data-icon="inline-start" />
              使用 GitHub 登录
            </Button>
          </form>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            已检测到 GitHub provider 配置。登录成功后会回到 <span className="font-medium">{redirectTo}</span>，并继续使用当前账号的数据隔离范围。
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            <div className="flex items-start gap-3">
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="grid gap-2">
                <p className="font-medium text-amber-900">当前环境还没有配置外部登录 provider。</p>
                <p>
                  {!isProduction
                    ? "开发模式下仍可使用默认体验账号浏览页面、试用导出和 AI 功能；生产环境则不会放行未配置的真实登录。"
                    : "当前部署处于生产模式，未配置 provider 时不会建立真实登录会话。"}
                </p>
                <p>
                  上线前请至少配置 <code>AUTH_SECRET</code>、<code>AUTH_GITHUB_ID</code> 和{" "}
                  <code>AUTH_GITHUB_SECRET</code>。
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-medium text-slate-900">当前可以直接体验的内容</p>
            <ul className="grid gap-2 text-sm leading-6 text-slate-600">
              <li>成员、病历、药品与过敏信息的原型浏览</li>
              <li>顶部一键导出 JSON / CSV</li>
              <li>隐私说明、使用声明与登录配置说明</li>
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-11 rounded-2xl px-5" variant="outline">
          <Link href={redirectTo}>
            <ArrowRightIcon className="size-4" aria-hidden="true" />
            {githubEnabled || !isProduction ? "继续进入资料台" : "返回首页"}
          </Link>
        </Button>
        <Button asChild className="h-11 rounded-2xl px-5" variant="outline">
          <a href="/api/export?format=json">
            <DownloadIcon className="size-4" aria-hidden="true" />
            预览导出入口
          </a>
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        提示：这里的登录流程只负责建立账号边界，不替代正式病历系统。涉及诊断、药物调整和处方变更时，请以医生或药师建议为准。
      </div>
    </section>
  )
}
