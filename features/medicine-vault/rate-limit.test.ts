import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { createMemoryRateLimiter } from "./rate-limit"

describe("memory rate limiter", () => {
  it("limits calls by user and route key inside the configured window", () => {
    const limiter = createMemoryRateLimiter({
      limit: 2,
      windowMs: 60_000,
      now: () => 1_000,
    })

    assert.equal(limiter.check("user-1", "assistant").allowed, true)
    assert.equal(limiter.check("user-1", "assistant").allowed, true)

    const blocked = limiter.check("user-1", "assistant")
    assert.equal(blocked.allowed, false)
    assert.equal(blocked.retryAfterSeconds, 60)
  })

  it("keeps different users and route keys isolated", () => {
    const limiter = createMemoryRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: () => 1_000,
    })

    assert.equal(limiter.check("user-1", "assistant").allowed, true)
    assert.equal(limiter.check("user-2", "assistant").allowed, true)
    assert.equal(limiter.check("user-1", "extract").allowed, true)
    assert.equal(limiter.check("user-1", "assistant").allowed, false)
  })
})
