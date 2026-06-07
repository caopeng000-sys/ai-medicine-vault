import "dotenv/config"

import { existsSync } from "node:fs"

import { config } from "dotenv"

import { checkProductionEnv, formatProductionEnvReport } from "@/features/medicine-vault/production-env-check"

config()

if (existsSync(".env.local")) {
  config({ path: ".env.local", override: true })
}

const report = formatProductionEnvReport(checkProductionEnv())

for (const item of report.checks) {
  const label = item.required ? "required" : "optional"
  const status = item.ok ? "ok" : "missing"
  console.log(`${status.padEnd(7)} [${label}] ${item.name}${item.message ? ` — ${item.message}` : ""}`)
}

if (!report.ok) {
  console.error(`\nMissing required env: ${report.missingRequired.join(", ")}`)
  process.exit(1)
}

console.info("\nProduction env check passed.")
