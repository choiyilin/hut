import "server-only"

import { LRUCache } from "lru-cache"
import { z } from "zod"

import { mapboxToken } from "@/env/server"

import { createRateLimiter, type RateLimiter } from "./rate-limiter"
import type { GeocodeCoords, GeocodeResult } from "./types"

// Mapbox returns more fields than this; we only validate the bits we read so
// upstream additions don't break parsing.
const MapboxResponseSchema = z.object({
  features: z.array(z.object({ center: z.tuple([z.number(), z.number()]).rest(z.number()) })),
})

// ── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_TIMEOUT_MS = 5_000
const NYC_PROXIMITY = "-73.998,40.732"
const CACHE_MAX = 1_000
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000 // 24h — addresses don't move

// Burst 20, refill 5/sec → 300/min, well under Mapbox's 600/min limit.
const RATE_LIMIT_CAPACITY = 20
const RATE_LIMIT_REFILL_PER_SEC = 5

// ── Module-level singletons ──────────────────────────────────────────────────

const cache = new LRUCache<string, GeocodeResult>({
  max: CACHE_MAX,
  ttl: CACHE_TTL_MS,
})

let rateLimiter: RateLimiter = createRateLimiter({
  capacity: RATE_LIMIT_CAPACITY,
  refillPerSecond: RATE_LIMIT_REFILL_PER_SEC,
})

// Test-only entry points — reset between tests so state doesn't bleed.
export function __resetGeocodeCacheForTests(): void {
  cache.clear()
}

export function __setGeocodeRateLimiterForTests(rl: RateLimiter): void {
  rateLimiter = rl
}

export function __resetGeocodeRateLimiterForTests(): void {
  rateLimiter = createRateLimiter({
    capacity: RATE_LIMIT_CAPACITY,
    refillPerSecond: RATE_LIMIT_REFILL_PER_SEC,
  })
}

// ── Public API ───────────────────────────────────────────────────────────────

export type GeocodeOptions = {
  readonly signal?: AbortSignal
  readonly timeoutMs?: number
  /** Skip the LRU cache (used by the backfill route to force fresh lookups). */
  readonly bypassCache?: boolean
}

/**
 * Geocode a single address against Mapbox's NYC-proximate forward geocoder.
 *
 * Failure modes are explicit (see GeocodeResult discriminated union):
 *   - found            — coordinates available; `cached` indicates LRU hit
 *   - not-found        — Mapbox returned 200 with no features
 *   - rate-limited     — local token bucket exhausted (we never hit Mapbox)
 *   - timeout          — request exceeded `timeoutMs` (default 5s)
 *   - upstream-error   — Mapbox returned a non-2xx
 *   - config-error     — no Mapbox token available; fail loudly
 */
export async function geocode(
  address: string,
  options: GeocodeOptions = {},
): Promise<GeocodeResult> {
  const trimmed = address.trim()
  if (!trimmed) return { kind: "not-found" }

  if (!mapboxToken) {
    return { kind: "config-error", reason: "MAPBOX_SECRET_TOKEN / NEXT_PUBLIC_MAPBOX_TOKEN unset" }
  }

  const cacheKey = trimmed.toLowerCase()
  if (!options.bypassCache) {
    const hit = cache.get(cacheKey)
    if (hit?.kind === "found") return { kind: "found", coords: hit.coords, cached: true }
    if (hit?.kind === "not-found") return hit
  }

  if (!rateLimiter.tryAcquire()) {
    return { kind: "rate-limited", retryAfterMs: rateLimiter.retryAfterMs() }
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const linkedSignal = mergeSignals(options.signal, controller.signal)

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json`,
    )
    url.searchParams.set("access_token", mapboxToken)
    url.searchParams.set("country", "US")
    url.searchParams.set("proximity", NYC_PROXIMITY)
    url.searchParams.set("types", "address")
    url.searchParams.set("limit", "1")

    const res = await fetch(url.toString(), { signal: linkedSignal })

    if (res.status === 429) {
      return { kind: "rate-limited", retryAfterMs: parseRetryAfter(res) }
    }
    if (!res.ok) {
      return { kind: "upstream-error", status: res.status }
    }

    const data: unknown = await res.json()
    const coords = parseCenter(data)
    if (!coords) {
      const miss: GeocodeResult = { kind: "not-found" }
      cache.set(cacheKey, miss)
      return miss
    }

    const found: GeocodeResult = { kind: "found", coords, cached: false }
    cache.set(cacheKey, found)
    return found
  } catch (err) {
    if (isAbortError(err)) return { kind: "timeout" }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCenter(data: unknown): GeocodeCoords | null {
  const parsed = MapboxResponseSchema.safeParse(data)
  if (!parsed.success) return null
  const first = parsed.data.features[0]
  if (!first) return null
  const [lng, lat] = first.center
  return { lat, lng }
}

function parseRetryAfter(res: Response): number {
  const header = res.headers.get("retry-after")
  if (!header) return 1_000
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds * 1_000)
  return 1_000
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")
}

function mergeSignals(a: AbortSignal | undefined, b: AbortSignal): AbortSignal {
  if (!a) return b
  if (a.aborted) return a
  // Prefer the standard once it lands; for now an AbortController bridge.
  const controller = new AbortController()
  const onAbort = (): void => controller.abort()
  a.addEventListener("abort", onAbort, { once: true })
  b.addEventListener("abort", onAbort, { once: true })
  return controller.signal
}

export type { GeocodeResult } from "./types"
