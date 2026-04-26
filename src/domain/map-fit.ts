/**
 * Pure geometry decisions for the listings map. Extracted from the
 * `ListingsBrowseMap` effect so the framing logic is unit-testable without
 * touching mapbox-gl.
 */

export type GeoPoint = { readonly lat: number; readonly lng: number }

export type FitTarget =
  | { readonly kind: "default-bounds" }
  | { readonly kind: "single"; readonly center: readonly [number, number] }
  | {
      readonly kind: "bounds"
      readonly southwest: readonly [number, number]
      readonly northeast: readonly [number, number]
    }

/**
 * Decide the next camera move based on the listings currently in view.
 *
 * - 0 listings → fall back to the NYC default bounds.
 * - 1 listing → centre + zoom on that single pin (a fitBounds call collapses
 *   to zero-area and Mapbox refuses to fly).
 * - 2+ listings → fit the encompassing bbox.
 */
export function pickFitTarget(listings: readonly GeoPoint[]): FitTarget {
  if (listings.length === 0) return { kind: "default-bounds" }
  const first = listings[0]
  if (listings.length === 1 && first) {
    return { kind: "single", center: [first.lng, first.lat] }
  }

  let minLat = Infinity
  let minLng = Infinity
  let maxLat = -Infinity
  let maxLng = -Infinity
  for (const { lat, lng } of listings) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }
  return {
    kind: "bounds",
    southwest: [minLng, minLat],
    northeast: [maxLng, maxLat],
  }
}

/**
 * Filter to listings with real coordinates. Listings the geocoder couldn't
 * place (or that haven't been geocoded yet) are stored as `0,0` and would
 * pin a marker in the Atlantic — drop them.
 */
export function geoListings<T extends GeoPoint>(listings: readonly T[]): T[] {
  return listings.filter((l) => l.lat !== 0 || l.lng !== 0)
}
