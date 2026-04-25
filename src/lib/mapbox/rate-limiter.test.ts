import { describe, expect, it } from "vitest"

import { createRateLimiter } from "./rate-limiter"

function fakeClock(start = 1_000_000) {
  let t = start
  return {
    now: () => t,
    advance: (ms: number): void => {
      t += ms
    },
  }
}

describe("createRateLimiter — token bucket", () => {
  it("starts full and lets capacity-many requests through immediately", () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ capacity: 5, refillPerSecond: 1, now: clock.now })
    for (let i = 0; i < 5; i++) expect(rl.tryAcquire()).toBe(true)
    expect(rl.tryAcquire()).toBe(false)
  })

  it("refills tokens over time at the configured rate", () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ capacity: 2, refillPerSecond: 1, now: clock.now })
    expect(rl.tryAcquire()).toBe(true)
    expect(rl.tryAcquire()).toBe(true)
    expect(rl.tryAcquire()).toBe(false)
    clock.advance(1_000) // +1 token
    expect(rl.tryAcquire()).toBe(true)
    expect(rl.tryAcquire()).toBe(false)
    clock.advance(2_000) // +2 tokens but capped at capacity (2)
    expect(rl.tryAcquire()).toBe(true)
    expect(rl.tryAcquire()).toBe(true)
    expect(rl.tryAcquire()).toBe(false)
  })

  it("retryAfterMs is 0 when a token is available", () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ capacity: 1, refillPerSecond: 1, now: clock.now })
    expect(rl.retryAfterMs()).toBe(0)
  })

  it("retryAfterMs reports the time until the next token", () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ capacity: 1, refillPerSecond: 2, now: clock.now })
    rl.tryAcquire()
    expect(rl.retryAfterMs()).toBe(500) // 1 / 2 per second = 500ms
    clock.advance(250)
    expect(rl.retryAfterMs()).toBe(250)
  })

  it("does not refill when the clock has not advanced", () => {
    const clock = fakeClock()
    const rl = createRateLimiter({ capacity: 1, refillPerSecond: 1, now: clock.now })
    rl.tryAcquire()
    expect(rl.tryAcquire()).toBe(false)
    expect(rl.tryAcquire()).toBe(false)
  })
})
