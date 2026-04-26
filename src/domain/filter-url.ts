import {
  type FilterState,
  DEFAULT_FILTERS,
  BedFilterSchema,
  BathFilterSchema,
  FilterListingTypeSchema,
  SortOptionSchema,
} from "@/schemas/filter-state"

/**
 * Read-side input — what `useSearchParams()` exposes once spread into a plain
 * object. Both `string` and `null` are tolerated since `URLSearchParams.get`
 * returns either, depending on call site.
 */
export type FilterParams = Readonly<Record<string, string | null | undefined>>

const PARAM = {
  search: "q",
  neighborhoods: "n",
  minPrice: "min",
  maxPrice: "max",
  beds: "beds",
  baths: "baths",
  amenities: "amenities",
  sort: "sort",
  listingType: "type",
  moveInDate: "movein",
  buildingType: "bldg",
} as const

/**
 * Convert a query string (or anything iterable of [key, string] entries) into
 * a `FilterState`. Unknown / malformed values fall back to defaults — bad URLs
 * never crash the page; the worst case is "filter not applied."
 */
export function decodeFilters(params: FilterParams): FilterState {
  return {
    search: readString(params[PARAM.search]) ?? DEFAULT_FILTERS.search,
    neighborhoods: readList(params[PARAM.neighborhoods]),
    minPrice: readPrice(params[PARAM.minPrice]),
    maxPrice: readPrice(params[PARAM.maxPrice]),
    beds: readEnumList(params[PARAM.beds], BedFilterSchema),
    baths: readEnumList(params[PARAM.baths], BathFilterSchema),
    amenities: readList(params[PARAM.amenities]),
    sort: readEnum(params[PARAM.sort], SortOptionSchema) ?? DEFAULT_FILTERS.sort,
    listingType:
      readEnum(params[PARAM.listingType], FilterListingTypeSchema) ?? DEFAULT_FILTERS.listingType,
    moveInDate: readString(params[PARAM.moveInDate]) ?? DEFAULT_FILTERS.moveInDate,
    buildingType: readList(params[PARAM.buildingType]),
  }
}

/**
 * Convert a `FilterState` into URLSearchParams, emitting only fields that
 * differ from the defaults. Keeps shareable URLs short and stable —
 * `?q=upper&type=sale` rather than every key serialized.
 */
export function encodeFilters(filters: FilterState): URLSearchParams {
  const out = new URLSearchParams()

  if (filters.search !== DEFAULT_FILTERS.search) out.set(PARAM.search, filters.search)
  if (filters.neighborhoods.length > 0)
    out.set(PARAM.neighborhoods, filters.neighborhoods.join(","))
  if (typeof filters.minPrice === "number") out.set(PARAM.minPrice, String(filters.minPrice))
  if (typeof filters.maxPrice === "number") out.set(PARAM.maxPrice, String(filters.maxPrice))
  if (filters.beds.length > 0) out.set(PARAM.beds, filters.beds.join(","))
  if (filters.baths.length > 0) out.set(PARAM.baths, filters.baths.join(","))
  if (filters.amenities.length > 0) out.set(PARAM.amenities, filters.amenities.join(","))
  if (filters.sort !== DEFAULT_FILTERS.sort) out.set(PARAM.sort, filters.sort)
  if (filters.listingType !== DEFAULT_FILTERS.listingType) {
    out.set(PARAM.listingType, filters.listingType)
  }
  if (filters.moveInDate !== DEFAULT_FILTERS.moveInDate) {
    out.set(PARAM.moveInDate, filters.moveInDate)
  }
  if (filters.buildingType.length > 0) {
    out.set(PARAM.buildingType, filters.buildingType.join(","))
  }

  return out
}

// ── helpers ──────────────────────────────────────────────────────────────────

function readString(raw: string | null | undefined): string | undefined {
  if (raw === null || raw === undefined || raw === "") return undefined
  return raw
}

function readList(raw: string | null | undefined): string[] {
  const value = readString(raw)
  if (!value) return []
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function readEnumList<T extends string>(
  raw: string | null | undefined,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
): T[] {
  return readList(raw).flatMap((value) => {
    const result = schema.safeParse(value)
    return result.success ? [result.data] : []
  })
}

function readEnum<T extends string>(
  raw: string | null | undefined,
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
): T | undefined {
  const value = readString(raw)
  if (!value) return undefined
  const result = schema.safeParse(value)
  return result.success ? result.data : undefined
}

function readPrice(raw: string | null | undefined): number | "" {
  const value = readString(raw)
  if (!value) return ""
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return ""
  return n
}
