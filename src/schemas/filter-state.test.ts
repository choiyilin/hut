import { describe, expect, it } from "vitest"

import {
  BathFilterSchema,
  BedFilterSchema,
  DEFAULT_FILTERS,
  FilterStateSchema,
  SortOptionSchema,
} from "./filter-state"

describe("FilterStateSchema", () => {
  it("accepts DEFAULT_FILTERS as-is", () => {
    expect(FilterStateSchema.parse(DEFAULT_FILTERS)).toEqual(DEFAULT_FILTERS)
  })

  it("accepts numeric price bounds", () => {
    const result = FilterStateSchema.parse({
      ...DEFAULT_FILTERS,
      minPrice: 2000,
      maxPrice: 5000,
    })
    expect(result.minPrice).toBe(2000)
    expect(result.maxPrice).toBe(5000)
  })

  it("accepts the empty-string price sentinel", () => {
    expect(
      FilterStateSchema.parse({ ...DEFAULT_FILTERS, minPrice: "", maxPrice: "" }).minPrice,
    ).toBe("")
  })

  it("rejects an arbitrary string price", () => {
    expect(
      FilterStateSchema.safeParse({ ...DEFAULT_FILTERS, minPrice: "$2000" as never }).success,
    ).toBe(false)
  })

  it("rejects an unknown sort option", () => {
    expect(
      FilterStateSchema.safeParse({ ...DEFAULT_FILTERS, sort: "alphabetical" as never }).success,
    ).toBe(false)
  })
})

describe("Bed/Bath/Sort enums", () => {
  it("accepts every BedFilter value", () => {
    for (const v of ["studio", "1", "2", "3", "4+"] as const) {
      expect(BedFilterSchema.parse(v)).toBe(v)
    }
    expect(BedFilterSchema.safeParse("five").success).toBe(false)
  })

  it("accepts every BathFilter value", () => {
    for (const v of ["1", "2", "3", "4"] as const) {
      expect(BathFilterSchema.parse(v)).toBe(v)
    }
    expect(BathFilterSchema.safeParse("0.5").success).toBe(false)
  })

  it("accepts every SortOption value", () => {
    for (const v of ["newest", "price-asc", "price-desc", "sqft-desc"] as const) {
      expect(SortOptionSchema.parse(v)).toBe(v)
    }
    expect(SortOptionSchema.safeParse("oldest").success).toBe(false)
  })
})
