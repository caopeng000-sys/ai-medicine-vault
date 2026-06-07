type RateLimitEntry = {
  count: number
  windowStartedAt: number
}

export type RateLimitOptions = Readonly<{
  maxRequests: number
  windowMs: number
}>

export type RateLimitResult =
  | Readonly<{ allowed: true }>
  | Readonly<{ allowed: false; retryAfterSeconds: number }>

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, RateLimitEntry>()

  function checkRateLimit(key: string): RateLimitResult {
    const now = Date.now()
    const current = buckets.get(key)

    if (!current || now - current.windowStartedAt >= options.windowMs) {
      buckets.set(key, { count: 1, windowStartedAt: now })
      return { allowed: true }
    }

    if (current.count >= options.maxRequests) {
      const retryAfterMs = options.windowMs - (now - current.windowStartedAt)
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      }
    }

    current.count += 1
    buckets.set(key, current)
    return { allowed: true }
  }

  return { checkRateLimit }
}

export const assistantQueryRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60_000,
})

export const aiImageExtractRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
})

export function rateLimitResponse(retryAfterSeconds: number) {
  return Response.json(
    { message: "请求过于频繁，请稍后再试。" },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  )
}
