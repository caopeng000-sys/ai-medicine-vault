import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"

import {
  DEFAULT_DEVELOPMENT_USER,
  getCurrentUser,
  requireCurrentUser,
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

  it("fails closed in production until real authentication is implemented", async () => {
    process.env.NODE_ENV = "production"

    assert.equal(await getCurrentUser(), null)
    await assert.rejects(
      requireCurrentUser(),
      /生产环境缺少真实登录会话/,
    )
  })
})
