// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 shim — schemas and pure logic now live under src/.
//
// New code should import from `@/schemas/...` or `@/domain/...` directly. This
// barrel exists only so the legacy app/ + components/ + contexts/ + lib/ files
// don't churn before Phase 4-7 rewrites them. Phase 7 deletes this file.
// ─────────────────────────────────────────────────────────────────────────────

export {
  AcTypeSchema,
  HeatTypeSchema,
  LaundryTypeSchema,
  ListingSchema,
  ListingStatusSchema,
  ListingTypeSchema,
  ParkingTypeSchema,
  PetPolicySchema,
  PropertyTypeSchema,
  type AcType,
  type HeatType,
  type LaundryType,
  type Listing,
  type ListingStatus,
  type ListingType,
  type ParkingType,
  type PetPolicy,
  type PropertyType,
} from "@/schemas/listing"

export { OpenHouseSlotSchema, type OpenHouseSlot } from "@/schemas/open-house-slot"

export { RealtorListingRowSchema, type RealtorListingRow } from "@/schemas/realtor-listing-row"

export {
  BathFilterSchema,
  BedFilterSchema,
  DEFAULT_FILTERS,
  FilterStateSchema,
  SortOptionSchema,
  type BathFilter,
  type BedFilter,
  type FilterState,
  type SortOption,
} from "@/schemas/filter-state"

export { realtorRowToListing } from "@/domain/realtor-row-to-listing"
export { countActiveFilters, filterAndSortListings } from "@/domain/filter"
export { matchesNeighborhoodSelection, PARENT_TO_SUBS } from "@/domain/neighborhoods"
export { deriveAmenities, type AmenitySource } from "@/domain/amenities"
