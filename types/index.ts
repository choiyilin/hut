export interface Listing {
  id: string
  title: string
  price: number
  beds: number
  baths: number
  sqft: number
  address: string
  neighborhood: string
  lat: number
  lng: number
  imageUrl: string
  videoUrl?: string
  amenities: string[]
  description: string
  datePosted: string
  featured: boolean
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "sqft-desc"
export type BedFilter = "any" | "studio" | "1" | "2" | "3" | "4+"
export type BathFilter = "any" | "1" | "2+"

export interface FilterState {
  search: string
  neighborhoods: string[]
  minPrice: number | ""
  maxPrice: number | ""
  beds: BedFilter
  baths: BathFilter
  amenities: string[]
  sort: SortOption
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  neighborhoods: [],
  minPrice: "",
  maxPrice: "",
  beds: "any",
  baths: "any",
  amenities: [],
  sort: "newest",
}

/** How many filter groups are currently active (for mobile badge) */
export function countActiveFilters(filters: FilterState): number {
  let count = 0
  if (filters.search.trim()) count++
  if (filters.neighborhoods.length > 0) count++
  if (filters.minPrice !== "" || filters.maxPrice !== "") count++
  if (filters.beds !== "any") count++
  if (filters.baths !== "any") count++
  if (filters.amenities.length > 0) count++
  return count
}

/**
 * Applies all active filters (AND logic) then sorts.
 * Swap the data source in filterAndSortListings to migrate to a DB later —
 * the filter/sort logic itself doesn't change.
 */
export function filterAndSortListings(
  listings: Listing[],
  filters: FilterState
): Listing[] {
  const q = filters.search.trim().toLowerCase()

  const filtered = listings.filter((listing) => {
    // ── Text search ─────────────────────────────────────────────
    if (q) {
      const haystack = [
        listing.title,
        listing.address,
        listing.neighborhood,
        listing.description,
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }

    // ── Neighborhood ─────────────────────────────────────────────
    if (
      filters.neighborhoods.length > 0 &&
      !filters.neighborhoods.includes(listing.neighborhood)
    )
      return false

    // ── Price ─────────────────────────────────────────────────────
    if (filters.minPrice !== "" && listing.price < filters.minPrice)
      return false
    if (filters.maxPrice !== "" && listing.price > filters.maxPrice)
      return false

    // ── Beds ──────────────────────────────────────────────────────
    if (filters.beds === "studio" && listing.beds !== 0) return false
    if (filters.beds === "1" && listing.beds !== 1) return false
    if (filters.beds === "2" && listing.beds !== 2) return false
    if (filters.beds === "3" && listing.beds !== 3) return false
    if (filters.beds === "4+" && listing.beds < 4) return false

    // ── Baths ─────────────────────────────────────────────────────
    if (filters.baths === "1" && listing.baths !== 1) return false
    if (filters.baths === "2+" && listing.baths < 2) return false

    // ── Amenities (AND — listing must have ALL checked) ───────────
    if (
      filters.amenities.length > 0 &&
      !filters.amenities.every((a) => listing.amenities.includes(a))
    )
      return false

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
      default:
        // Featured listings surface first within the "newest" sort.
        // TODO: replace with DB-driven relevance/boost scoring.
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return (
          new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime()
        )
    }
  })
}
