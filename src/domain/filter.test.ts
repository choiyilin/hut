import { describe, expect, it } from "vitest"

import { makeListing } from "../../tests/fixtures/listing"
import { DEFAULT_FILTERS, type FilterState } from "@/schemas/filter-state"

import { countActiveFilters, filterAndSortListings } from "./filter"

function withFilters(override: Partial<FilterState>): FilterState {
  return { ...DEFAULT_FILTERS, ...override }
}

describe("countActiveFilters", () => {
  it("returns 0 for the default filter state", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0)
  })

  it("counts a non-empty search after trimming", () => {
    expect(countActiveFilters(withFilters({ search: "  loft  " }))).toBe(1)
    expect(countActiveFilters(withFilters({ search: "   " }))).toBe(0)
  })

  it("counts each active group exactly once", () => {
    expect(
      countActiveFilters(
        withFilters({
          search: "park",
          neighborhoods: ["Park Slope"],
          minPrice: 2000,
          maxPrice: 5000,
          beds: ["1"],
          baths: ["1"],
          amenities: ["doorman"],
          moveInDate: "2026-06-01",
          buildingType: ["rental"],
        }),
      ),
    ).toBe(8)
  })

  it("counts a price range as one group whether one or both bounds are set", () => {
    expect(countActiveFilters(withFilters({ minPrice: 2000 }))).toBe(1)
    expect(countActiveFilters(withFilters({ maxPrice: 5000 }))).toBe(1)
    expect(countActiveFilters(withFilters({ minPrice: 2000, maxPrice: 5000 }))).toBe(1)
  })
})

describe("filterAndSortListings — listingType", () => {
  const rentMock = makeListing({ id: "rent-1" })
  const saleListing = makeListing({ id: "sale-1", listingType: "sale" })

  it("rent mode excludes sale listings (legacy mocks default to rent)", () => {
    const out = filterAndSortListings([rentMock, saleListing], DEFAULT_FILTERS)
    expect(out.map((l) => l.id)).toEqual(["rent-1"])
  })

  it("sale mode keeps only listings with listingType === sale", () => {
    const out = filterAndSortListings([rentMock, saleListing], withFilters({ listingType: "sale" }))
    expect(out.map((l) => l.id)).toEqual(["sale-1"])
  })

  it("rent mode keeps explicit listingType=rent listings", () => {
    const explicit = makeListing({ id: "rent-2", listingType: "rent" })
    expect(filterAndSortListings([explicit], DEFAULT_FILTERS).map((l) => l.id)).toEqual(["rent-2"])
  })
})

describe("filterAndSortListings — search", () => {
  it("matches title, address, neighborhood, and description (case-insensitive)", () => {
    const a = makeListing({ id: "a", title: "Garfield Loft" })
    const b = makeListing({ id: "b", address: "10 Loft Way" })
    const c = makeListing({ id: "c", neighborhood: "Loft District" })
    const d = makeListing({ id: "d", description: "A roomy LOFT" })
    const e = makeListing({ id: "e", title: "studio", description: "no L word" })
    const out = filterAndSortListings([a, b, c, d, e], withFilters({ search: "loft" }))
    expect(out.map((l) => l.id).sort()).toEqual(["a", "b", "c", "d"])
  })

  it("trims whitespace and ignores blank-only searches", () => {
    const a = makeListing({ id: "a" })
    expect(filterAndSortListings([a], withFilters({ search: "   " }))).toHaveLength(1)
  })
})

describe("filterAndSortListings — neighborhood", () => {
  it("matches by exact neighborhood", () => {
    const ps = makeListing({ id: "ps", neighborhood: "Park Slope" })
    const dumbo = makeListing({ id: "d", neighborhood: "DUMBO" })
    expect(
      filterAndSortListings([ps, dumbo], withFilters({ neighborhoods: ["Park Slope"] })).map(
        (l) => l.id,
      ),
    ).toEqual(["ps"])
  })
})

describe("filterAndSortListings — price", () => {
  const cheap = makeListing({ id: "c", price: 1000 })
  const mid = makeListing({ id: "m", price: 3000 })
  const lux = makeListing({ id: "l", price: 9000 })

  it("respects minPrice", () => {
    expect(
      filterAndSortListings([cheap, mid, lux], withFilters({ minPrice: 2500 })).map((l) => l.id),
    ).toEqual(["m", "l"])
  })

  it("respects maxPrice", () => {
    expect(
      filterAndSortListings([cheap, mid, lux], withFilters({ maxPrice: 4000 })).map((l) => l.id),
    ).toEqual(["c", "m"])
  })

  it("respects both bounds", () => {
    expect(
      filterAndSortListings([cheap, mid, lux], withFilters({ minPrice: 2000, maxPrice: 5000 })).map(
        (l) => l.id,
      ),
    ).toEqual(["m"])
  })

  it("ignores empty-string sentinels (no price filter)", () => {
    expect(
      filterAndSortListings([cheap, mid, lux], withFilters({ minPrice: "", maxPrice: "" })).length,
    ).toBe(3)
  })
})

describe("filterAndSortListings — beds", () => {
  const studio = makeListing({ id: "s", beds: 0 })
  const one = makeListing({ id: "1", beds: 1 })
  const two = makeListing({ id: "2", beds: 2 })
  const three = makeListing({ id: "3", beds: 3 })
  const four = makeListing({ id: "4", beds: 4 })
  const five = makeListing({ id: "5", beds: 5 })
  const all = [studio, one, two, three, four, five]

  it.each([
    [["studio"], ["s"]],
    [["1"], ["1"]],
    [["2"], ["2"]],
    [["3"], ["3"]],
    [["4+"], ["4", "5"]],
    [
      ["studio", "4+"],
      ["s", "4", "5"],
    ],
  ] as const)("matches %s", (beds, expected) => {
    expect(filterAndSortListings(all, withFilters({ beds: [...beds] })).map((l) => l.id)).toEqual(
      expected,
    )
  })
})

describe("filterAndSortListings — baths", () => {
  const half = makeListing({ id: "h", baths: 1.5 })
  const two = makeListing({ id: "2", baths: 2 })
  const three = makeListing({ id: "3", baths: 3 })
  const four = makeListing({ id: "4", baths: 4 })
  const five = makeListing({ id: "5", baths: 5 })
  const all = [half, two, three, four, five]

  it.each([
    [["1"], ["h"]],
    [["2"], ["2"]],
    [["3"], ["3"]],
    [["4"], ["4", "5"]],
  ] as const)("matches %s on floor(baths)", (baths, expected) => {
    expect(filterAndSortListings(all, withFilters({ baths: [...baths] })).map((l) => l.id)).toEqual(
      expected,
    )
  })
})

describe("filterAndSortListings — amenities (AND)", () => {
  it("requires every selected amenity", () => {
    const both = makeListing({ id: "both", amenities: ["doorman", "gym"] })
    const only = makeListing({ id: "only", amenities: ["doorman"] })
    expect(
      filterAndSortListings([both, only], withFilters({ amenities: ["doorman", "gym"] })).map(
        (l) => l.id,
      ),
    ).toEqual(["both"])
  })
})

describe("filterAndSortListings — sort", () => {
  const a = makeListing({
    id: "a",
    price: 5000,
    sqft: 700,
    datePosted: "2026-04-10",
    featured: false,
  })
  const b = makeListing({
    id: "b",
    price: 2000,
    sqft: 1200,
    datePosted: "2026-04-15",
    featured: false,
  })
  const c = makeListing({
    id: "c",
    price: 7000,
    sqft: 500,
    datePosted: "2026-04-01",
    featured: true,
  })

  it("price-asc orders by price ascending", () => {
    expect(
      filterAndSortListings([a, b, c], withFilters({ sort: "price-asc" })).map((l) => l.id),
    ).toEqual(["b", "a", "c"])
  })

  it("price-desc orders by price descending", () => {
    expect(
      filterAndSortListings([a, b, c], withFilters({ sort: "price-desc" })).map((l) => l.id),
    ).toEqual(["c", "a", "b"])
  })

  it("sqft-desc orders by sqft descending", () => {
    expect(
      filterAndSortListings([a, b, c], withFilters({ sort: "sqft-desc" })).map((l) => l.id),
    ).toEqual(["b", "a", "c"])
  })

  it("newest surfaces featured first, then by date desc", () => {
    expect(filterAndSortListings([a, b, c], DEFAULT_FILTERS).map((l) => l.id)).toEqual([
      "c",
      "b",
      "a",
    ])
  })

  it("newest tie-breaks by date when none are featured", () => {
    expect(filterAndSortListings([a, b], DEFAULT_FILTERS).map((l) => l.id)).toEqual(["b", "a"])
  })

  it("newest places a featured listing before a newer non-featured one", () => {
    const olderFeatured = makeListing({
      id: "f",
      featured: true,
      datePosted: "2026-01-01",
    })
    const newerPlain = makeListing({
      id: "p",
      featured: false,
      datePosted: "2026-04-01",
    })
    // Two-element fixture pins both branches of the `a.featured ? -1 : 1`
    // ternary regardless of sort algorithm internals.
    expect(
      filterAndSortListings([newerPlain, olderFeatured], DEFAULT_FILTERS).map((l) => l.id),
    ).toEqual(["f", "p"])
    expect(
      filterAndSortListings([olderFeatured, newerPlain], DEFAULT_FILTERS).map((l) => l.id),
    ).toEqual(["f", "p"])
  })
})
