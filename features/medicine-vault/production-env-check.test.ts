import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import { checkProductionEnv, formatProductionEnvReport } from "./production-env-check"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("production env check", () => {
  it("reports missing required variables", () => {
    delete process.env.DATABASE_URL
    delete process.env.AUTH_SECRET
    delete process.env.GITHUB_ID
    delete process.env.GITHUB_SECRET
    delete process.env.DASHSCOPE_API_KEY

    const report = formatProductionEnvReport(checkProductionEnv())

    assert.equal(report.ok, false)
    assert.ok(report.missingRequired.includes("DATABASE_URL"))
    assert.ok(report.missingRequired.includes("AUTH_SECRET"))
  })

  it("passes when required variables are present", () => {
    process.env.DATABASE_URL = "postgresql://example"
    process.env.AUTH_SECRET = "secret"
    process.env.GITHUB_ID = "id"
    process.env.GITHUB_SECRET = "secret"
    process.env.DASHSCOPE_API_KEY = "key"

    const report = formatProductionEnvReport(checkProductionEnv())

    assert.equal(report.ok, true)
    assert.deepEqual(report.missingRequired, [])
  })
})
