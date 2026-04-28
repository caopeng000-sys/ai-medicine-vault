import { KeyRoundIcon, ShieldCheckIcon } from "lucide-react"

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

  return (
    <section className="mx-auto grid max-w-2xl gap-6 rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
        <ShieldCheckIcon className="size-6" aria-hidden="true" />
      </div>
      <div className="grid gap-3">
        <h1 className="text-3xl font-semibold text-slate-950">登录家庭健康资料台</h1>
        <p className="text-sm leading-6 text-slate-600">
          登录后才能访问成员、病历、药品图片和 AI 助手。系统会按账号隔离数据，避免不同用户之间互相看到健康资料。
        </p>
      </div>

      {githubEnabled ? (
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
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          当前还没有配置 GitHub 登录环境变量。上线前请配置 `AUTH_SECRET`、`AUTH_GITHUB_ID` 和
          `AUTH_GITHUB_SECRET`。
        </div>
      )}
    </section>
  )
}
