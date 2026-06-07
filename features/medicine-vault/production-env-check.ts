type EnvCheck = Readonly<{
  name: string
  ok: boolean
  required: boolean
  message?: string
}>

function hasValue(name: string) {
  return Boolean(process.env[name]?.trim())
}

export function checkProductionEnv(): EnvCheck[] {
  const checks: EnvCheck[] = [
    { name: "DATABASE_URL", ok: hasValue("DATABASE_URL"), required: true },
    { name: "AUTH_SECRET", ok: hasValue("AUTH_SECRET"), required: true },
    { name: "GITHUB_ID", ok: hasValue("GITHUB_ID"), required: true },
    { name: "GITHUB_SECRET", ok: hasValue("GITHUB_SECRET"), required: true },
    { name: "DASHSCOPE_API_KEY", ok: hasValue("DASHSCOPE_API_KEY"), required: true },
    { name: "NEXT_PUBLIC_SENTRY_DSN", ok: hasValue("NEXT_PUBLIC_SENTRY_DSN"), required: false },
    { name: "SENTRY_DSN", ok: hasValue("SENTRY_DSN"), required: false },
    { name: "S3_BUCKET", ok: hasValue("S3_BUCKET"), required: false },
    { name: "S3_ACCESS_KEY_ID", ok: hasValue("S3_ACCESS_KEY_ID"), required: false },
    { name: "S3_SECRET_ACCESS_KEY", ok: hasValue("S3_SECRET_ACCESS_KEY"), required: false },
  ]

  const s3Partial = checks.filter((item) => item.name.startsWith("S3_"))
  const s3Enabled = s3Partial.some((item) => item.ok)

  if (!s3Enabled) {
    return checks
  }

  return checks.map((item) => {
    if (!item.name.startsWith("S3_") || item.ok) {
      return item
    }

    return {
      ...item,
      message: "已启用部分 S3 变量，请补齐 bucket 与 access key。",
    }
  })
}

export function formatProductionEnvReport(checks: EnvCheck[]) {
  const missingRequired = checks.filter((item) => item.required && !item.ok).map((item) => item.name)

  return {
    ok: missingRequired.length === 0,
    missingRequired,
    checks,
  }
}
