import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

const originalPlaywrightTestDatabaseUrl = process.env.PLAYWRIGHT_TEST_DATABASE_URL

afterEach(() => {
  if (originalPlaywrightTestDatabaseUrl === undefined) {
    delete process.env.PLAYWRIGHT_TEST_DATABASE_URL
  } else {
    process.env.PLAYWRIGHT_TEST_DATABASE_URL = originalPlaywrightTestDatabaseUrl
  }
})

describe("playwright test database configuration", () => {
  it("uses an explicit test database url when it is provided", async () => {
    process.env.PLAYWRIGHT_TEST_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:6432/ci_db"

    const helpers = await import("./test-db")

    assert.equal(helpers.TEST_DATABASE_URL, "postgresql://postgres:postgres@127.0.0.1:6432/ci_db")
    assert.equal(helpers.TEST_DATABASE_PORT, 6432)
  })
})
