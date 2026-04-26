"use client"

import { useMemo, useState } from "react"
import type { Listing } from "@/schemas/listing"
import type { FilterState } from "@/schemas/filter-state"
import { countActiveFilters, filterAndSortListings } from "@/domain/filter"
import { useFilterState } from "@/features/listings-browse/use-filter-state"
import { ListingCard } from "./ListingCard"
import { FilterSidebar } from "./FilterSidebar"
import { FilterBar } from "./FilterBar"
import { AppNav } from "./AppNav"
import { ReelsView } from "./ReelsView"
import dynamic from "next/dynamic"

const ListingsBrowseMap = dynamic(() => import("./ListingsBrowseMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-gray-100" />,
})

type Props = {
  initialListings: Listing[]
}

export function ListingsClient({ initialListings }: Props) {
  const { filters, setFilters, clearFilters } = useFilterState()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [view, setView] = useState<"grid" | "reels">("grid")

  const results = useMemo(
    () => filterAndSortListings(initialListings, filters),
    [initialListings, filters],
  )

  const reelsListings = useMemo(() => results.filter((l) => Boolean(l.videoUrl)), [results])

  const activeCount = countActiveFilters(filters)

  const handleChange = (partial: Partial<FilterState>) => setFilters(partial)

  const clearAll = () => clearFilters()

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        {/* ── Row 1: heading, then search + filters on same line ──────────── */}
        <div className="mb-6">
          <h1 className="text-2xl leading-none font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-5xl">
            {filters.listingType === "sale" ? "Homes for Sale" : "Browse Rentals"}
          </h1>

          {/* Desktop: search pill + filter pills on one row */}
          {view === "grid" && (
            <div className="mt-4 hidden flex-wrap items-center gap-2 lg:flex">
              <div className="relative w-64 flex-none">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <i className="fa-solid fa-magnifying-glass text-sm text-gray-300" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleChange({ search: e.target.value })}
                  placeholder="Search neighborhood, address, or keyword…"
                  aria-label="Search listings"
                  autoComplete="off"
                  className="w-full rounded-full border-2 border-gray-200 bg-white py-2.5 pr-10 pl-10 text-sm font-medium text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                />
                {filters.search && (
                  <button
                    onClick={() => handleChange({ search: "" })}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <i className="fa-solid fa-xmark text-xs" />
                  </button>
                )}
              </div>
              <FilterBar filters={filters} onChange={handleChange} onClear={clearAll} />
            </div>
          )}

          {/* Mobile: full-width search input */}
          <div className="relative mt-4 max-w-xl lg:hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <i className="fa-solid fa-magnifying-glass text-sm text-gray-300" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange({ search: e.target.value })}
              placeholder="Search neighborhood, address, or keyword…"
              aria-label="Search listings"
              autoComplete="off"
              className="w-full rounded-full border-2 border-gray-200 bg-white py-3 pr-10 pl-10 text-sm font-medium text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
            />
            {filters.search && (
              <button
                onClick={() => handleChange({ search: "" })}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            )}
          </div>
        </div>

        {/* ── Row 2: controls+grid (left) | map (right, parallel with grid) ── */}
        <div className="flex gap-5">
          {/* Listings column */}
          <div className="min-w-0 flex-1">
            {/* Controls bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6 sm:gap-3">
              <p className="flex-shrink-0 text-sm font-semibold text-gray-500">
                <span className="font-extrabold text-gray-900">
                  {view === "reels"
                    ? reelsListings.length.toLocaleString()
                    : results.length.toLocaleString()}
                </span>{" "}
                {(view === "reels" ? reelsListings.length : results.length) === 1
                  ? "apartment"
                  : "apartments"}{" "}
                found
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Mobile filter button */}
                {view === "grid" && (
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-700 lg:hidden"
                  >
                    <i className="fa-solid fa-sliders text-xs" />
                    Filters
                    {activeCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-gray-900">
                        {activeCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Rent / Buy toggle */}
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                  {(["rent", "sale"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleChange({ listingType: type })}
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                        filters.listingType === type
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {type === "rent" ? "Rent" : "Buy"}
                    </button>
                  ))}
                </div>

                {/* View toggle */}
                <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
                  <button
                    onClick={() => setView("grid")}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                      view === "grid"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    aria-label="Grid view"
                  >
                    <i className="fa-solid fa-table-cells text-xs" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setView("reels")}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                      view === "reels"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    aria-label="Reels view"
                  >
                    <i className="fa-solid fa-film text-xs" />
                    <span className="hidden sm:inline">Reels</span>
                  </button>
                </div>

                {/* Sort select — grid only */}
                {view === "grid" && (
                  <div className="relative">
                    <select
                      value={filters.sort}
                      onChange={(e) =>
                        handleChange({ sort: e.target.value as FilterState["sort"] })
                      }
                      aria-label="Sort listings"
                      className="cursor-pointer appearance-none rounded-full border border-gray-200 bg-white py-2 pr-8 pl-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="sqft-desc">Sqft: Large to Small</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <i className="fa-solid fa-chevron-down text-[9px] text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid */}
            {view === "grid" &&
              (results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <i className="fa-regular fa-face-frown text-2xl text-gray-300" />
                  </div>
                  <h2 className="mb-2 text-2xl font-extrabold text-gray-900">
                    Nothing quite matches
                  </h2>
                  <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-400">
                    Sorry, nothing quite matches your search criterion right now&hellip;
                  </p>
                  <button
                    onClick={clearAll}
                    className="rounded-full bg-gray-900 px-6 py-2.5 text-sm text-white transition-colors hover:bg-gray-700"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {results.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ))}
          </div>

          {/* Map — desktop only, parallel with grid */}
          {view === "grid" && (
            <div className="hidden flex-none lg:block" style={{ width: "38%" }}>
              <div className="sticky top-[77px] h-[calc(100vh-77px)] overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <ListingsBrowseMap listings={results} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reels overlay ───────────────────────────────────────────────── */}
      {view === "reels" && (
        <div className="fixed inset-x-0 bottom-0 z-40" style={{ top: "76px" }}>
          <button
            onClick={() => setView("grid")}
            aria-label="Back to grid view"
            className="absolute top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-black/50 py-2 pr-4 pl-3 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/70"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back
          </button>
          {reelsListings.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center bg-gray-900 px-6 text-center">
              <i className="fa-solid fa-film mb-4 text-5xl text-gray-700" />
              <h2 className="mb-2 text-2xl font-extrabold text-white">No video listings</h2>
              <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-400">
                No video listings match your current filters.
              </p>
              <button
                onClick={clearAll}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-100"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <ReelsView listings={reelsListings} />
          )}
        </div>
      )}

      {/* ── Mobile filter drawer ────────────────────────────────────────── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute top-0 left-0 flex h-full w-80 max-w-[90vw] flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-xl font-extrabold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                aria-label="Close filters"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar filters={filters} onChange={handleChange} onClear={clearAll} />
            </div>
            <div className="flex-shrink-0 border-t border-gray-100 p-4">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full rounded-full bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700"
              >
                Show {results.length === 0 ? "no" : results.length.toLocaleString()}{" "}
                {results.length === 1 ? "result" : "results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
