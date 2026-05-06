import './globals.css'

import { auth } from "@/auth"
import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppShell } from "@/components/medicine-vault/app-shell"
import { Providers } from "@/app/providers"
import { getCurrentUser } from "@/features/medicine-vault/auth-context"

export const metadata: Metadata = {
  title: 'MediVault AI',
  description: 'AI-assisted personal medical record and medicine knowledge vault.',
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const [session, currentUser] = await Promise.all([auth(), getCurrentUser()])

  return (
    <html lang="zh-CN">
      <body>
        <Providers session={session}>
          <AppShell currentUser={currentUser}>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
