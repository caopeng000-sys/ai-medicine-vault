import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  createRateLimiter,
  rateLimitResponse,
} from "./rate-limiter"

describe("rate limiter", () => {
  it("allows requests until the limit is reached", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 })

    assert.deepEqual(limiter.checkRateLimit("user-a"), { allowed: true })
    assert.deepEqual(limiter.checkRateLimit("user-a"), { allowed: true })
    assert.equal(limiter.checkRateLimit("user-a").allowed, false)
  })

  it("tracks limits independently per key", () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 })

    assert.deepEqual(limiter.checkRateLimit("user-a"), { allowed: true })
    assert.deepEqual(limiter.checkRateLimit("user-b"), { allowed: true })
    assert.equal(limiter.checkRateLimit("user-a").allowed, false)
  })

  it("returns a 429 response with Retry-After", async () => {
    const response = rateLimitResponse(12)

    assert.equal(response.status, 429)
    assert.equal(response.headers.get("Retry-After"), "12")
    assert.deepEqual(await response.json(), { message: "请求过于频繁，请稍后再试。" })
  })
})
