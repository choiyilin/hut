// Token-bucket rate limiter — minimal, in-memory, single-process.
//
// Mapbox's free tier is generous (600 req/min for the geocoder, ~10/sec
// burstable) but we don't want a runaway loop in /api/geocode/backfill to
// blow through the budget. This keeps us well under the limit and shaves
// thrash off retry storms.

export type RateLimiter = {
  readonly tryAcquire: () => boolean
  readonly retryAfterMs: () => number
}

export type RateLimiterOptions = {
  /** Maximum tokens in the bucket (burst capacity). */
  readonly capacity: number
  /** Tokens replenished per second. */
  readonly refillPerSecond: number
  /** Injected for deterministic tests; defaults to Date.now. */
  readonly now?: () => number
}

export function createRateLimiter(options: RateLimiterOptions): RateLimiter {
  const now = options.now ?? Date.now
  const refillIntervalMs = 1000 / options.refillPerSecond
  let tokens = options.capacity
  let lastRefill = now()

  function refill(): void {
    const t = now()
    const elapsed = t - lastRefill
    if (elapsed <= 0) return
    const earned = elapsed / refillIntervalMs
    tokens = Math.min(options.capacity, tokens + earned)
    lastRefill = t
  }

  return {
    tryAcquire() {
      refill()
      if (tokens >= 1) {
        tokens -= 1
        return true
      }
      return false
    },
    retryAfterMs() {
      refill()
      if (tokens >= 1) return 0
      const missing = 1 - tokens
      return Math.ceil(missing * refillIntervalMs)
    },
  }
}
