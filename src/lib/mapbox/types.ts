// ── Geocoding result taxonomy ────────────────────────────────────────────────
//
// The legacy code returned `{ lat: 0, lng: 0 }` for both "address not found"
// and "Mapbox returned nothing useful" — callers couldn't tell the difference
// between a valid (0,0) coordinate and an error. This type makes every outcome
// distinguishable so callers can decide policy (retry, surface to admin,
// silently skip).

export type GeocodeCoords = {
  readonly lat: number
  readonly lng: number
}

export type GeocodeResult =
  | { readonly kind: "found"; readonly coords: GeocodeCoords; readonly cached: boolean }
  | { readonly kind: "not-found" }
  | { readonly kind: "rate-limited"; readonly retryAfterMs: number }
  | { readonly kind: "timeout" }
  | { readonly kind: "upstream-error"; readonly status: number }
  | { readonly kind: "config-error"; readonly reason: string }

export type GeocodeFn = (address: string, signal?: AbortSignal) => Promise<GeocodeResult>
