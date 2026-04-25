import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// `server-only` throws under our jsdom environment; stub it to a no-op so the
// adapter can be imported by tests. Mock must be hoisted above the import.
vi.mock("server-only", () => ({}))

import {
  __resetGeocodeCacheForTests,
  __resetGeocodeRateLimiterForTests,
  __setGeocodeRateLimiterForTests,
  geocode,
} from "./geocode"
import { createRateLimiter } from "./rate-limiter"

const FOUND_PAYLOAD = {
  features: [{ center: [-73.98, 40.73], place_name: "Times Square, New York" }],
}

function mockFetchOnce(
  response: { status?: number; body?: unknown; headers?: Record<string, string> } = {},
) {
  const status = response.status ?? 200
  // `??` would replace explicit `null` (used in malformed-payload tests) with
  // the default. Use `in` to detect whether the caller meant null.
  const body = "body" in response ? response.body : FOUND_PAYLOAD
  const headers = new Headers(response.headers ?? {})
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify(body), { status, headers }))
}

beforeEach(() => {
  __resetGeocodeCacheForTests()
  __resetGeocodeRateLimiterForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("geocode", () => {
  it("returns 'not-found' for an empty input without hitting the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const result = await geocode("   ")
    expect(result).toEqual({ kind: "not-found" })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("returns 'found' with parsed coordinates on a successful Mapbox response", async () => {
    mockFetchOnce()
    const result = await geocode("123 Main St")
    expect(result).toEqual({ kind: "found", coords: { lat: 40.73, lng: -73.98 }, cached: false })
  })

  it("serves repeat lookups from the LRU cache without re-hitting the network", async () => {
    const fetchSpy = mockFetchOnce()
    await geocode("47 Avenue B")
    const second = await geocode("47 Avenue B")
    expect(second).toEqual({ kind: "found", coords: { lat: 40.73, lng: -73.98 }, cached: true })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("normalizes case so 'CHELSEA HOTEL' and 'chelsea hotel' share a cache entry", async () => {
    const fetchSpy = mockFetchOnce()
    await geocode("Chelsea Hotel")
    await geocode("chelsea hotel")
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("respects bypassCache: true (forces a fresh upstream request)", async () => {
    // Factory — each call returns a fresh Response so .json() can be invoked once.
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(FOUND_PAYLOAD), { status: 200 })),
      )
    await geocode("X")
    await geocode("X") // cached — should not hit fetch
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    await geocode("X", { bypassCache: true })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("returns 'not-found' (and caches it) when Mapbox returns no features", async () => {
    const fetchSpy = mockFetchOnce({ body: { features: [] } })
    expect(await geocode("nowhere road")).toEqual({ kind: "not-found" })
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(await geocode("nowhere road")).toEqual({ kind: "not-found" })
    expect(fetchSpy).toHaveBeenCalledTimes(1) // second call served from cache
  })

  it("returns 'rate-limited' with retryAfterMs when Mapbox responds 429", async () => {
    mockFetchOnce({ status: 429, headers: { "retry-after": "3" }, body: { error: "rate" } })
    const result = await geocode("hot address")
    expect(result).toEqual({ kind: "rate-limited", retryAfterMs: 3_000 })
  })

  it("returns retryAfterMs=1000 default when 429 has no retry-after header", async () => {
    mockFetchOnce({ status: 429, body: { error: "rate" } })
    expect(await geocode("a")).toEqual({ kind: "rate-limited", retryAfterMs: 1_000 })
  })

  it("returns 'upstream-error' on non-2xx, non-429 responses", async () => {
    mockFetchOnce({ status: 500, body: { error: "down" } })
    expect(await geocode("b")).toEqual({ kind: "upstream-error", status: 500 })
  })

  it("returns 'timeout' when fetch is aborted", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        signal?.addEventListener("abort", () => {
          const err = new Error("aborted")
          err.name = "AbortError"
          reject(err)
        })
      })
    })
    const result = await geocode("c", { timeoutMs: 5 })
    expect(result).toEqual({ kind: "timeout" })
  })

  it("propagates non-abort errors", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("DNS fail"))
    await expect(geocode("d")).rejects.toThrow("DNS fail")
  })

  it("falls through with not-found when Mapbox payload is malformed", async () => {
    mockFetchOnce({ body: { features: "not-an-array" } })
    expect(await geocode("e")).toEqual({ kind: "not-found" })
  })

  it("falls through with not-found when center array is incomplete", async () => {
    mockFetchOnce({ body: { features: [{ center: [-73.98] }] } })
    expect(await geocode("f")).toEqual({ kind: "not-found" })
  })

  it.each([
    ["payload is null", null],
    ["payload is a string", "oops"],
    ["payload is an array", []],
    ["features[0] is not an object", { features: ["raw-string"] }],
    ["features[0] is an array", { features: [["x"]] }],
    ["center coordinates are non-numeric", { features: [{ center: ["x", "y"] }] }],
    ["center has number then string", { features: [{ center: [-73.98, "y"] }] }],
  ])("returns 'not-found' when Mapbox returns malformed payload (%s)", async (_label, body) => {
    mockFetchOnce({ body })
    expect((await geocode(`malformed-${String(Math.random())}`)).kind).toBe("not-found")
  })

  it("returns 'rate-limited' locally without hitting fetch when the bucket is empty", async () => {
    __setGeocodeRateLimiterForTests(createRateLimiter({ capacity: 0, refillPerSecond: 0.001 }))
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const result = await geocode("g")
    expect(result.kind).toBe("rate-limited")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("defaults retry-after to 1000ms when the header is non-numeric", async () => {
    mockFetchOnce({ status: 429, headers: { "retry-after": "soon" }, body: {} })
    expect(await geocode("h")).toEqual({ kind: "rate-limited", retryAfterMs: 1_000 })
  })

  it("defaults retry-after to 1000ms when the header is zero", async () => {
    mockFetchOnce({ status: 429, headers: { "retry-after": "0" }, body: {} })
    expect(await geocode("i")).toEqual({ kind: "rate-limited", retryAfterMs: 1_000 })
  })

  it("returns 'timeout' when an externally-provided AbortSignal fires first", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        signal?.addEventListener("abort", () => {
          const err = new Error("aborted")
          err.name = "AbortError"
          reject(err)
        })
      })
    })
    const ctrl = new AbortController()
    const promise = geocode("j", { signal: ctrl.signal })
    ctrl.abort()
    expect(await promise).toEqual({ kind: "timeout" })
  })

  it("returns the caller's signal directly when it is already aborted", async () => {
    const ctrl = new AbortController()
    ctrl.abort()
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal?.aborted) {
          const err = new Error("aborted")
          err.name = "AbortError"
          reject(err)
          return
        }
        init?.signal?.addEventListener("abort", () => {
          const err = new Error("aborted")
          err.name = "AbortError"
          reject(err)
        })
      })
    })
    expect(await geocode("k", { signal: ctrl.signal })).toEqual({ kind: "timeout" })
  })
})
