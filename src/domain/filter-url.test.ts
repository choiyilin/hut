import { describe, expect, it } from "vitest"

import { DEFAULT_FILTERS, type FilterState } from "@/schemas/filter-state"

import { decodeFilters, encodeFilters } from "./filter-url"

function paramsObject(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(params.entries())
}

function decodeFromString(qs: string): FilterState {
  return decodeFilters(Object.fromEntries(new URLSearchParams(qs).entries()))
}

describe("decodeFilters", () => {
  it("returns defaults for an empty query string", () => {
    expect(decodeFilters({})).toEqual(DEFAULT_FILTERS)
  })

  it("treats null and empty-string params as absent", () => {
    expect(decodeFilters({ q: null, n: "", min: undefined })).toEqual(DEFAULT_FILTERS)
  })

  it("reads search via the `q` key", () => {
    expect(decodeFilters({ q: "upper west" }).search).toBe("upper west")
  })

  it("splits comma-separated lists, trimming whitespace", () => {
    expect(decodeFilters({ n: "Park Slope, DUMBO" }).neighborhoods).toEqual(["Park Slope", "DUMBO"])
  })

  it("drops empty entries from list values", () => {
    expect(decodeFilters({ amenities: "doorman,,gym" }).amenities).toEqual(["doorman", "gym"])
  })

  it("filters list entries that don't match the enum schema", () => {
    expect(decodeFilters({ beds: "studio,foo,2" }).beds).toEqual(["studio", "2"])
    expect(decodeFilters({ baths: "1,99,2" }).baths).toEqual(["1", "2"])
  })

  it("keeps the default sort when the URL value is unknown", () => {
    expect(decodeFilters({ sort: "weirdness" }).sort).toBe(DEFAULT_FILTERS.sort)
  })

  it("accepts the known sort options", () => {
    expect(decodeFilters({ sort: "price-asc" }).sort).toBe("price-asc")
    expect(decodeFilters({ sort: "sqft-desc" }).sort).toBe("sqft-desc")
  })

  it("accepts the known listing types and falls back otherwise", () => {
    expect(decodeFilters({ type: "sale" }).listingType).toBe("sale")
    expect(decodeFilters({ type: "lease" }).listingType).toBe(DEFAULT_FILTERS.listingType)
  })

  it("parses numeric prices and rejects negative or non-numeric", () => {
    expect(decodeFilters({ min: "2000", max: "5000" }).minPrice).toBe(2000)
    expect(decodeFilters({ min: "2000", max: "5000" }).maxPrice).toBe(5000)
    expect(decodeFilters({ min: "abc" }).minPrice).toBe("")
    expect(decodeFilters({ min: "-100" }).minPrice).toBe("")
    expect(decodeFilters({ min: "Infinity" }).minPrice).toBe("")
  })

  it("works against URLSearchParams output round-trip", () => {
    const decoded = decodeFromString("q=hello&type=sale&n=Astoria,Bushwick&min=2500")
    expect(decoded.search).toBe("hello")
    expect(decoded.listingType).toBe("sale")
    expect(decoded.neighborhoods).toEqual(["Astoria", "Bushwick"])
    expect(decoded.minPrice).toBe(2500)
  })
})

describe("encodeFilters", () => {
  it("emits an empty query for the default state", () => {
    expect(paramsObject(encodeFilters(DEFAULT_FILTERS))).toEqual({})
  })

  it("emits only the fields that differ from defaults", () => {
    const filters: FilterState = {
      ...DEFAULT_FILTERS,
      search: "park slope",
      listingType: "sale",
    }
    expect(paramsObject(encodeFilters(filters))).toEqual({
      q: "park slope",
      type: "sale",
    })
  })

  it("joins lists with commas", () => {
    const filters: FilterState = {
      ...DEFAULT_FILTERS,
      neighborhoods: ["DUMBO", "Park Slope"],
      amenities: ["doorman", "gym"],
      buildingType: ["co-op", "condo"],
      beds: ["studio", "1"],
      baths: ["1", "2"],
    }
    expect(paramsObject(encodeFilters(filters))).toEqual({
      n: "DUMBO,Park Slope",
      amenities: "doorman,gym",
      bldg: "co-op,condo",
      beds: "studio,1",
      baths: "1,2",
    })
  })

  it("emits price params when a number, omits when empty-sentinel", () => {
    expect(
      paramsObject(encodeFilters({ ...DEFAULT_FILTERS, minPrice: 2000, maxPrice: "" })),
    ).toEqual({ min: "2000" })
  })

  it("emits moveInDate when set", () => {
    expect(paramsObject(encodeFilters({ ...DEFAULT_FILTERS, moveInDate: "2026-06-01" }))).toEqual({
      movein: "2026-06-01",
    })
  })

  it("URL-encodes strings with special chars when serialized to a string", () => {
    const filters: FilterState = {
      ...DEFAULT_FILTERS,
      search: "Hell's Kitchen & more",
    }
    const qs = encodeFilters(filters).toString()
    expect(qs).toContain("q=Hell")
    // URLSearchParams percent-encodes; round-trip recovers the original.
    expect(decodeFromString(qs).search).toBe("Hell's Kitchen & more")
  })
})

describe("encode → decode round-trip", () => {
  it("preserves a filter state with every field populated", () => {
    const filters: FilterState = {
      search: "loft with terrace",
      neighborhoods: ["Williamsburg", "DUMBO"],
      minPrice: 3000,
      maxPrice: 7500,
      beds: ["1", "2"],
      baths: ["1"],
      amenities: ["doorman", "outdoor space", "laundry in-unit"],
      sort: "price-desc",
      listingType: "sale",
      moveInDate: "2026-08-15",
      buildingType: ["condo"],
    }
    const qs = encodeFilters(filters).toString()
    expect(decodeFromString(qs)).toEqual(filters)
  })

  it("preserves the default state through a no-op round-trip", () => {
    const qs = encodeFilters(DEFAULT_FILTERS).toString()
    expect(decodeFromString(qs)).toEqual(DEFAULT_FILTERS)
  })
})
