import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  action,
}: Readonly<{
  title: string
  description: string
  action?: ReactNode
}>) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-2">
        <h1 className="text-3xl font-semibold leading-tight tracking-normal text-balance">{title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
