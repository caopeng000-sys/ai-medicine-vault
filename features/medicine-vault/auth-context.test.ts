import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import {
  createAuthContext,
  DEFAULT_DEVELOPMENT_USER,
  getCurrentUser,
  requireCurrentUser,
  UnauthorizedError,
} from "./auth-context"

const originalNodeEnv = process.env.NODE_ENV

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

describe("auth context", () => {
  it("returns the fixed development user outside production", async () => {
    process.env.NODE_ENV = "development"

    const user = await getCurrentUser()

    assert.deepEqual(user, DEFAULT_DEVELOPMENT_USER)
    assert.deepEqual(await requireCurrentUser(), {
      userId: DEFAULT_DEVELOPMENT_USER.id,
    })
  })

  it("keeps the development fallback when Auth.js has no session", async () => {
    process.env.NODE_ENV = "development"
    const context = createAuthContext({
      readSession: async () => null,
    })

    assert.deepEqual(await context.getCurrentUser(), DEFAULT_DEVELOPMENT_USER)
    assert.deepEqual(await context.requireCurrentUser(), {
      userId: DEFAULT_DEVELOPMENT_USER.id,
    })
  })

  it("fails closed in production without a session", async () => {
    process.env.NODE_ENV = "production"
    const context = createAuthContext({
      readSession: async () => null,
    })

    assert.equal(await context.getCurrentUser(), null)
    await assert.rejects(
      context.requireCurrentUser(),
      (error) => error instanceof UnauthorizedError && /未登录/.test(error.message),
    )
  })

  it("maps the Auth.js session user into the repository context", async () => {
    process.env.NODE_ENV = "production"
    const context = createAuthContext({
      readSession: async () => ({
        user: {
          id: "user-authenticated",
          name: "Authenticated User",
          email: "user@example.com",
          image: "https://example.com/avatar.png",
        },
        expires: "2099-01-01T00:00:00.000Z",
      }),
    })

    assert.deepEqual(await context.getCurrentUser(), {
      id: "user-authenticated",
      name: "Authenticated User",
      email: "user@example.com",
      image: "https://example.com/avatar.png",
    })
    assert.deepEqual(await context.requireCurrentUser(), {
      userId: "user-authenticated",
    })
  })
})
