import './globals.css'

import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AppShell } from "@/components/medicine-vault/app-shell"

export const metadata: Metadata = {
  title: 'MediVault AI',
  description: 'AI-assisted personal medical record and medicine knowledge vault.',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
