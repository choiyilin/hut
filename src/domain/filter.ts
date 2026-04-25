import type { FilterState } from "@/schemas/filter-state"
import type { Listing } from "@/schemas/listing"

import { matchesNeighborhoodSelection } from "./neighborhoods"

/** How many filter groups are currently active (drives the mobile badge). */
export function countActiveFilters(filters: FilterState): number {
  let count = 0
  if (filters.search.trim()) count++
  if (filters.neighborhoods.length > 0) count++
  if (filters.minPrice !== "" || filters.maxPrice !== "") count++
  if (filters.beds.length > 0) count++
  if (filters.baths.length > 0) count++
  if (filters.amenities.length > 0) count++
  if (filters.moveInDate) count++
  if (filters.buildingType.length > 0) count++
  return count
}

/**
 * Applies all active filters (AND across groups) then sorts.
 * Pure — same input always produces the same output. Single source of truth
 * shared by the listings grid, reels view, and any future query-side cache.
 */
export function filterAndSortListings(
  listings: readonly Listing[],
  filters: FilterState,
): Listing[] {
  const q = filters.search.trim().toLowerCase()

  const filtered = listings.filter((listing) => {
    // ── Listing type (rent vs sale) ────────────────────────────────────────
    // Static mock listings have no listingType → treated as rent.
    if (filters.listingType === "sale") {
      if (listing.listingType !== "sale") return false
    } else if (listing.listingType === "sale") {
      return false
    }

    // ── Text search ────────────────────────────────────────────────────────
    if (q) {
      const haystack = [listing.title, listing.address, listing.neighborhood, listing.description]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    // ── Neighborhood (parent → sub expansion) ──────────────────────────────
    if (
      filters.neighborhoods.length > 0 &&
      !matchesNeighborhoodSelection(listing.neighborhood, filters.neighborhoods)
    ) {
      return false
    }

    // ── Price range ────────────────────────────────────────────────────────
    if (filters.minPrice !== "" && listing.price < filters.minPrice) return false
    if (filters.maxPrice !== "" && listing.price > filters.maxPrice) return false

    // ── Beds (multi-select OR — match any selected value) ──────────────────
    if (filters.beds.length > 0) {
      const match = filters.beds.some((b) => {
        if (b === "studio") return listing.beds === 0
        if (b === "1") return listing.beds === 1
        if (b === "2") return listing.beds === 2
        if (b === "3") return listing.beds === 3
        return listing.beds >= 4
      })
      if (!match) return false
    }

    // ── Baths (multi-select OR on floor(baths)) ────────────────────────────
    if (filters.baths.length > 0) {
      const match = filters.baths.some((b) => {
        if (b === "1") return Math.floor(listing.baths) === 1
        if (b === "2") return Math.floor(listing.baths) === 2
        if (b === "3") return Math.floor(listing.baths) === 3
        return listing.baths >= 4
      })
      if (!match) return false
    }

    // ── Amenities (AND — listing must include every selected amenity) ──────
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((a) => listing.amenities.includes(a))
    ) {
      return false
    }

    return true
  })

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return a.price - b.price
      case "price-desc":
        return b.price - a.price
      case "sqft-desc":
        return b.sqft - a.sqft
      case "newest":
        // Featured listings surface first within the "newest" sort.
        // Phase 2 will replace this with DB-driven boost scoring.
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
    }
  })
}
