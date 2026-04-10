export type OpenHouseSlot = { date: string; time: string; notes: string }

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
  // Extended fields (optional — existing mock listings stay type-safe)
  listingType?: "rent" | "sale"
  propertyType?: "apartment" | "house" | "condo" | "townhouse" | "co-op" | "multi-family"
  status?: "active" | "pending" | "off-market" | "draft"
  unitNumber?: string
  city?: string
  state?: string
  zip?: string
  photoUrls?: string[]
  floorPlanUrl?: string
  halfBaths?: number
  lotSize?: number
  floorNumber?: number
  totalFloors?: number
  yearBuilt?: number
  parkingType?: "none" | "street" | "garage"
  parkingSpots?: number
  laundryType?: "in-unit" | "in-building" | "none"
  petPolicy?: "no-pets" | "cats-ok" | "dogs-ok" | "size-limit"
  isFurnished?: boolean
  acType?: "central" | "window" | "none"
  heatType?: "electric" | "gas" | "steam" | "radiant"
  utilitiesIncluded?: string[]
  availableDate?: string
  leaseTerms?: string[]
  openHouseSlots?: OpenHouseSlot[]
  securityDeposit?: number
  brokerFeeAmount?: number
  brokerFeePct?: number
  hoaFees?: number
  propertyTaxesYear?: number
}

export type RealtorListingRow = {
  id: string
  user_id: string
  title: string
  price: number
  beds: number
  baths: number
  half_baths: number
  sqft: number
  address: string
  neighborhood: string
  lat: number
  lng: number
  image_url: string
  amenities: string[]
  description: string
  date_posted: string
  featured: boolean
  // New columns (all have DB defaults so existing rows are safe)
  listing_type: string | null
  property_type: string | null
  status: "active" | "pending" | "off-market" | "draft" | null
  unit_number: string | null
  city: string | null
  state: string | null
  zip: string | null
  security_deposit: number | null
  has_broker_fee: boolean
  broker_fee_amount: number | null
  broker_fee_pct: number | null
  hoa_fees: number | null
  property_taxes_year: number | null
  lot_size: number | null
  floor_number: number | null
  total_floors: number | null
  year_built: number | null
  photo_urls: string[]
  video_url: string | null
  floor_plan_url: string | null
  parking_type: string
  parking_spots: number
  laundry_type: string
  has_balcony: boolean
  has_terrace: boolean
  has_backyard: boolean
  has_roof_deck: boolean
  pet_policy: string
  is_furnished: boolean
  has_storage: boolean
  has_doorman: boolean
  has_elevator: boolean
  has_gym: boolean
  has_pool: boolean
  has_rooftop: boolean
  has_package_room: boolean
  has_bike_room: boolean
  has_ev_charging: boolean
  has_live_in_super: boolean
  is_accessible: boolean
  ac_type: string
  heat_type: string | null
  utilities_included: string[]
  flooring_type: string | null
  has_dishwasher: boolean
  has_microwave: boolean
  has_washer_dryer: boolean
  available_date: string | null
  lease_terms: string[]
  open_house_slots: OpenHouseSlot[]
}

export function realtorRowToListing(row: RealtorListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    beds: row.beds,
    baths: row.baths + (row.half_baths > 0 ? 0.5 : 0),
    sqft: row.sqft,
    address: row.address,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    imageUrl: row.photo_urls.length > 0 ? row.photo_urls[0] : row.image_url,
    videoUrl: row.video_url ?? undefined,
    amenities: row.amenities,
    description: row.description,
    datePosted: row.date_posted,
    featured: row.featured,
    listingType: (row.listing_type as Listing["listingType"]) ?? undefined,
    propertyType: (row.property_type as Listing["propertyType"]) ?? undefined,
    status: row.status ?? undefined,
    unitNumber: row.unit_number ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    zip: row.zip ?? undefined,
    photoUrls: row.photo_urls.length > 0 ? row.photo_urls : undefined,
    floorPlanUrl: row.floor_plan_url ?? undefined,
    halfBaths: row.half_baths > 0 ? row.half_baths : undefined,
    lotSize: row.lot_size ?? undefined,
    floorNumber: row.floor_number ?? undefined,
    totalFloors: row.total_floors ?? undefined,
    yearBuilt: row.year_built ?? undefined,
    parkingType: (row.parking_type as Listing["parkingType"]) ?? undefined,
    parkingSpots: row.parking_spots > 0 ? row.parking_spots : undefined,
    laundryType: (row.laundry_type as Listing["laundryType"]) ?? undefined,
    petPolicy: (row.pet_policy as Listing["petPolicy"]) ?? undefined,
    isFurnished: row.is_furnished,
    acType: (row.ac_type as Listing["acType"]) ?? undefined,
    heatType: (row.heat_type as Listing["heatType"]) ?? undefined,
    utilitiesIncluded: row.utilities_included.length > 0 ? row.utilities_included : undefined,
    availableDate: row.available_date ?? undefined,
    leaseTerms: row.lease_terms.length > 0 ? row.lease_terms : undefined,
    openHouseSlots: row.open_house_slots.length > 0 ? row.open_house_slots : undefined,
    securityDeposit: row.security_deposit ?? undefined,
    brokerFeeAmount: row.broker_fee_amount ?? undefined,
    brokerFeePct: row.broker_fee_pct ?? undefined,
    hoaFees: row.hoa_fees ?? undefined,
    propertyTaxesYear: row.property_taxes_year ?? undefined,
  }
}

// ── Neighborhood parent→sub cluster map ───────────────────────────────────────
// Built once at module load from NYC_BOROUGHS. Selecting a parent neighborhood
// in the filter also matches its indented sub-neighborhoods.
import { NYC_BOROUGHS } from "@/data/nyc-neighborhoods"

const PARENT_TO_SUBS = (() => {
  const map = new Map<string, Set<string>>()
  for (const borough of NYC_BOROUGHS) {
    for (const area of borough.areas) {
      let parent: string | null = null
      let subs = new Set<string>()
      for (const n of area.neighborhoods) {
        if (!n.sub) {
          if (parent && subs.size > 0) map.set(parent, new Set(subs))
          parent = n.name
          subs = new Set()
        } else if (parent) {
          subs.add(n.name)
        }
      }
      if (parent && subs.size > 0) map.set(parent, new Set(subs))
    }
  }
  return map
})()

// ── Shared types ──────────────────────────────────────────────────────────────

export type SortOption = "newest" | "price-asc" | "price-desc" | "sqft-desc"
export type BedFilter = "studio" | "1" | "2" | "3" | "4+"
export type BathFilter = "1" | "2" | "3" | "4"

export interface FilterState {
  search: string
  neighborhoods: string[]
  minPrice: number | ""
  maxPrice: number | ""
  beds: BedFilter[]
  baths: BathFilter[]
  amenities: string[]
  sort: SortOption
  listingType: "rent" | "sale"
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  neighborhoods: [],
  minPrice: "",
  maxPrice: "",
  beds: [],
  baths: [],
  amenities: [],
  sort: "newest",
  listingType: "rent",
}

/** How many filter groups are currently active (for mobile badge) */
export function countActiveFilters(filters: FilterState): number {
  let count = 0
  if (filters.search.trim()) count++
  if (filters.neighborhoods.length > 0) count++
  if (filters.minPrice !== "" || filters.maxPrice !== "") count++
  if (filters.beds.length > 0) count++
  if (filters.baths.length > 0) count++
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
    // ── Listing type (rent vs sale) ───────────────────────────────
    // Static mock listings have no listingType → treated as rent
    if (filters.listingType === "sale") {
      if (listing.listingType !== "sale") return false
    } else {
      if (listing.listingType === "sale") return false
    }

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
    // Selecting a parent (e.g. "Chelsea") also matches sub-neighborhoods
    // (e.g. "West Chelsea"). Selecting a sub matches only that sub.
    if (filters.neighborhoods.length > 0) {
      const match = filters.neighborhoods.some(
        (sel) =>
          sel === listing.neighborhood ||
          (PARENT_TO_SUBS.get(sel)?.has(listing.neighborhood) ?? false)
      )
      if (!match) return false
    }

    // ── Price ─────────────────────────────────────────────────────
    if (filters.minPrice !== "" && listing.price < filters.minPrice)
      return false
    if (filters.maxPrice !== "" && listing.price > filters.maxPrice)
      return false

    // ── Beds (multi-select OR — matches any selected value) ───────
    if (filters.beds.length > 0) {
      const match = filters.beds.some((b) => {
        if (b === "studio") return listing.beds === 0
        if (b === "1") return listing.beds === 1
        if (b === "2") return listing.beds === 2
        if (b === "3") return listing.beds === 3
        if (b === "4+") return listing.beds >= 4
        return false
      })
      if (!match) return false
    }

    // ── Baths (multi-select OR) ────────────────────────────────────
    if (filters.baths.length > 0) {
      const match = filters.baths.some((b) => {
        if (b === "1") return Math.floor(listing.baths) === 1
        if (b === "2") return Math.floor(listing.baths) === 2
        if (b === "3") return Math.floor(listing.baths) === 3
        if (b === "4") return listing.baths >= 4
        return false
      })
      if (!match) return false
    }

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
