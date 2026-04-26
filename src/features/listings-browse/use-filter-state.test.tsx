import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_FILTERS } from "@/schemas/filter-state"

import { useFilterState } from "./use-filter-state"

const replace = vi.fn()
let currentSearch = ""
const pathname = "/listings"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(currentSearch),
}))

beforeEach(() => {
  currentSearch = ""
  replace.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("useFilterState", () => {
  it("returns DEFAULT_FILTERS for an empty URL", () => {
    const { result } = renderHook(() => useFilterState())
    expect(result.current.filters).toEqual(DEFAULT_FILTERS)
  })

  it("decodes the current URL into the filter state", () => {
    currentSearch = "q=upper&type=sale&n=DUMBO"
    const { result } = renderHook(() => useFilterState())
    expect(result.current.filters.search).toBe("upper")
    expect(result.current.filters.listingType).toBe("sale")
    expect(result.current.filters.neighborhoods).toEqual(["DUMBO"])
  })

  it("setFilters writes a partial change back to the URL via router.replace", () => {
    const { result } = renderHook(() => useFilterState())
    act(() => {
      result.current.setFilters({ search: "loft" })
    })
    expect(replace).toHaveBeenCalledTimes(1)
    expect(replace).toHaveBeenCalledWith("/listings?q=loft", { scroll: false })
  })

  it("setFilters merges into existing filters rather than replacing them", () => {
    currentSearch = "type=sale"
    const { result } = renderHook(() => useFilterState())
    act(() => {
      result.current.setFilters({ search: "loft" })
    })
    expect(replace).toHaveBeenCalledWith(
      // URLSearchParams iteration order is insertion order from encodeFilters.
      expect.stringContaining("q=loft"),
      { scroll: false },
    )
    const target = String(replace.mock.calls[0]?.[0])
    expect(target).toContain("type=sale")
  })

  it("setFilters writes a path-only URL when the result equals the defaults", () => {
    currentSearch = "q=loft"
    const { result } = renderHook(() => useFilterState())
    act(() => {
      result.current.setFilters({ search: "" })
    })
    expect(replace).toHaveBeenCalledWith("/listings", { scroll: false })
  })

  it("clearFilters resets the URL to the bare pathname", () => {
    currentSearch = "q=loft&type=sale"
    const { result } = renderHook(() => useFilterState())
    act(() => {
      result.current.clearFilters()
    })
    expect(replace).toHaveBeenCalledWith("/listings", { scroll: false })
  })

  it("returns referentially stable filters when the URL has not changed", () => {
    const { result, rerender } = renderHook(() => useFilterState())
    const before = result.current.filters
    rerender()
    expect(result.current.filters).toBe(before)
  })

  it("ignores invalid URL params and falls back to defaults", () => {
    currentSearch = "type=lease&sort=banana&min=foo"
    const { result } = renderHook(() => useFilterState())
    expect(result.current.filters.listingType).toBe(DEFAULT_FILTERS.listingType)
    expect(result.current.filters.sort).toBe(DEFAULT_FILTERS.sort)
    expect(result.current.filters.minPrice).toBe(DEFAULT_FILTERS.minPrice)
  })
})
