import { z } from "zod"

export const SortOptionSchema = z.enum(["newest", "price-asc", "price-desc", "sqft-desc"])
export const BedFilterSchema = z.enum(["studio", "1", "2", "3", "4+"])
export const BathFilterSchema = z.enum(["1", "2", "3", "4"])
export const FilterListingTypeSchema = z.enum(["rent", "sale"])

// minPrice/maxPrice carry "" as the empty-input sentinel (forms emit "" when
// cleared). Phase 4 URL-state migration will normalize these to undefined.
const PriceBoundSchema = z.union([z.number(), z.literal("")])

export const FilterStateSchema = z.object({
  search: z.string(),
  neighborhoods: z.array(z.string()),
  minPrice: PriceBoundSchema,
  maxPrice: PriceBoundSchema,
  beds: z.array(BedFilterSchema),
  baths: z.array(BathFilterSchema),
  amenities: z.array(z.string()),
  sort: SortOptionSchema,
  listingType: FilterListingTypeSchema,
  moveInDate: z.string(),
  buildingType: z.array(z.string()),
})

export type FilterState = z.infer<typeof FilterStateSchema>
export type SortOption = z.infer<typeof SortOptionSchema>
export type BedFilter = z.infer<typeof BedFilterSchema>
export type BathFilter = z.infer<typeof BathFilterSchema>

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
  moveInDate: "",
  buildingType: [],
}
