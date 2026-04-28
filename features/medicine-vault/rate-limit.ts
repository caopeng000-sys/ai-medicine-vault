export type RateLimitDecision = Readonly<{
  allowed: boolean
  retryAfterSeconds: number
  remaining: number
}>

export type MemoryRateLimiterOptions = Readonly<{
  limit: number
  windowMs: number
  now?: () => number
}>

export type MemoryRateLimiter = Readonly<{
  check: (userId: string, routeKey: string) => RateLimitDecision
  reset: () => void
}>

type Bucket = {
  count: number
  resetAt: number
}

export const RATE_LIMIT_PRODUCTION_NOTE =
  "Memory rate limiting is intended for single-instance development or small deployments. Use Redis, Upstash, Vercel KV, Cloudflare KV, or another shared store before running multiple app instances."

export function createMemoryRateLimiter(options: MemoryRateLimiterOptions): MemoryRateLimiter {
  const buckets = new Map<string, Bucket>()
  const now = options.now ?? Date.now

  return {
    check(userId, routeKey) {
      const currentTime = now()
      const key = `${userId}:${routeKey}`
      const existing = buckets.get(key)
      const bucket =
        existing && existing.resetAt > currentTime
          ? existing
          : {
              count: 0,
              resetAt: currentTime + options.windowMs,
            }

      if (bucket.count >= options.limit) {
        buckets.set(key, bucket)

        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000)),
          remaining: 0,
        }
      }

      bucket.count += 1
      buckets.set(key, bucket)

      return {
        allowed: true,
        retryAfterSeconds: Math.max(0, Math.ceil((bucket.resetAt - currentTime) / 1000)),
        remaining: Math.max(0, options.limit - bucket.count),
      }
    },
    reset() {
      buckets.clear()
    },
  }
}

export const assistantQueryRateLimiter = createMemoryRateLimiter({
  limit: 30,
  windowMs: 60 * 60 * 1000,
})

export const medicineExtractRateLimiter = createMemoryRateLimiter({
  limit: 12,
  windowMs: 60 * 60 * 1000,
})
