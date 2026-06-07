import type { ReactNode } from "react"

import { AppShell } from "@/components/medicine-vault/app-shell"
import { UserAccountMenu } from "@/components/medicine-vault/user-account-menu"

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <AppShell accountMenu={<UserAccountMenu />}>{children}</AppShell>
}
