import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import {
  DEFAULT_DEVELOPMENT_USER,
  __setSessionReaderForTests,
  getCurrentUser,
  requireCurrentUser,
} from "./auth-context"

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
  __setSessionReaderForTests(null)
})

describe("auth context", () => {
  it("returns the fixed development user outside production when no session exists", async () => {
    process.env.NODE_ENV = "development"
    __setSessionReaderForTests(async () => null)

    const user = await getCurrentUser()

    assert.deepEqual(user, DEFAULT_DEVELOPMENT_USER)
    assert.deepEqual(await requireCurrentUser(), {
      userId: DEFAULT_DEVELOPMENT_USER.id,
    })
  })

  it("prefers the authenticated session user when available", async () => {
    process.env.NODE_ENV = "development"
    __setSessionReaderForTests(async () => ({
      user: {
        id: "user-github",
        name: "GitHub User",
        email: "github@example.com",
      },
    }))

    assert.deepEqual(await getCurrentUser(), {
      id: "user-github",
      name: "GitHub User",
      email: "github@example.com",
    })
  })

  it("fails closed in production when no session exists", async () => {
    process.env.NODE_ENV = "production"
    __setSessionReaderForTests(async () => null)

    assert.equal(await getCurrentUser(), null)
    await assert.rejects(
      requireCurrentUser(),
      /未登录/,
    )
  })

  it("uses the authenticated session user in production", async () => {
    process.env.NODE_ENV = "production"
    __setSessionReaderForTests(async () => ({
      user: {
        id: "user-production",
        name: "Production User",
        email: "prod@example.com",
      },
    }))

    assert.deepEqual(await requireCurrentUser(), {
      userId: "user-production",
    })
  })
})
