import { ChevronDownIcon, LogOutIcon } from "lucide-react"

import { signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/features/medicine-vault/auth-context"

function initialsFromName(name: string) {
  const trimmed = name.trim()

  if (!trimmed) {
    return "U"
  }

  return trimmed.slice(0, 2).toUpperCase()
}

export async function UserAccountMenu() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white">
        {initialsFromName(user.name)}
      </span>
      <div className="hidden sm:block">
        <p className="text-sm font-medium text-slate-900">{user.name}</p>
        <p className="text-xs text-slate-500">{user.email ?? "已登录"}</p>
      </div>
      <form
        action={async () => {
          "use server"
          await signOut({ redirectTo: "/login" })
        }}
      >
        <Button
          aria-label="退出登录"
          className="rounded-2xl border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          size="icon"
          type="submit"
          variant="outline"
        >
          <LogOutIcon aria-hidden="true" className="size-4" />
        </Button>
      </form>
      <ChevronDownIcon className="hidden size-4 text-slate-400 sm:block" aria-hidden="true" />
    </div>
  )
}
