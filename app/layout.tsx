import './globals.css'

import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: 'MediVault AI',
  description: 'AI-assisted personal medical record and medicine knowledge vault.',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
