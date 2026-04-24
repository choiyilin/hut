"use client"

import { useState, useMemo } from "react"
import {
  type Listing,
  type FilterState,
  DEFAULT_FILTERS,
  countActiveFilters,
  filterAndSortListings,
} from "@/types"
import { ListingCard } from "./ListingCard"
import { FilterSidebar } from "./FilterSidebar"
import { FilterBar } from "./FilterBar"
import { AppNav } from "./AppNav"
import { ReelsView } from "./ReelsView"
import dynamic from "next/dynamic"

const ListingsBrowseMap = dynamic(() => import("./ListingsBrowseMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse rounded-2xl" />,
})

interface Props {
  initialListings: Listing[]
  initialQuery: string
  initialListingType?: "rent" | "sale"
}

export function ListingsClient({ initialListings, initialQuery, initialListingType = "rent" }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    search: initialQuery,
    listingType: initialListingType,
  })
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [view, setView] = useState<"grid" | "reels">("grid")

  const results = useMemo(
    () => filterAndSortListings(initialListings, filters),
    [initialListings, filters]
  )

  const reelsListings = useMemo(
    () => results.filter((l) => Boolean(l.videoUrl)),
    [results]
  )

  const activeCount = countActiveFilters(filters)

  const handleChange = (partial: Partial<FilterState>) =>
    setFilters((prev) => ({ ...prev, ...partial }))

  const clearAll = () => setFilters(DEFAULT_FILTERS)

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Row 1: heading, then search + filters on same line ──────────── */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-none">
            {filters.listingType === "sale" ? "Homes for Sale" : "Browse Rentals"}
          </h1>

          {/* Desktop: search pill + filter pills on one row */}
          {view === "grid" && (
            <div className="hidden lg:flex items-center gap-2 mt-4 flex-wrap">
              <div className="relative flex-none w-64">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-magnifying-glass text-gray-300 text-sm" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleChange({ search: e.target.value })}
                  placeholder="Search neighborhood, address, or keyword…"
                  aria-label="Search listings"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border-2 border-gray-200 rounded-full text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
                />
                {filters.search && (
                  <button
                    onClick={() => handleChange({ search: "" })}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="lg:hidden mt-4 relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-gray-300 text-sm" />
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleChange({ search: e.target.value })}
              placeholder="Search neighborhood, address, or keyword…"
              aria-label="Search listings"
              autoComplete="off"
              className="w-full pl-10 pr-10 py-3 bg-white border-2 border-gray-200 rounded-full text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => handleChange({ search: "" })}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
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
          <div className="flex-1 min-w-0">
            {/* Controls bar */}
            <div className="flex flex-wrap items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-3">
              <p className="text-sm font-semibold text-gray-500 flex-shrink-0">
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

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Mobile filter button */}
                {view === "grid" && (
                  <button
                    onClick={() => setMobileFilterOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-700 transition-colors"
                  >
                    <i className="fa-solid fa-sliders text-xs" />
                    Filters
                    {activeCount > 0 && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-gray-900 text-[10px] font-extrabold">
                        {activeCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Rent / Buy toggle */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
                  {(["rent", "sale"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleChange({ listingType: type })}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
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
                <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
                  <button
                    onClick={() => setView("grid")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
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
                      className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 cursor-pointer transition-colors"
                    >
                      <option value="newest">Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="sqft-desc">Sqft: Large to Small</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <i className="fa-solid fa-chevron-down text-gray-400 text-[9px]" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid */}
            {view === "grid" &&
              (results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-5">
                    <i className="fa-regular fa-face-frown text-gray-300 text-2xl" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                    Nothing quite matches
                  </h2>
                  <p className="text-sm text-gray-400 mb-6 max-w-sm leading-relaxed">
                    Sorry, nothing quite matches your search criterion right now&hellip;
                  </p>
                  <button
                    onClick={clearAll}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-700 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {results.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ))}
          </div>

          {/* Map — desktop only, parallel with grid */}
          {view === "grid" && (
            <div className="hidden lg:block flex-none" style={{ width: "38%" }}>
              <div className="sticky top-[77px] h-[calc(100vh-77px)] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
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
            className="absolute top-4 left-4 z-50 flex items-center gap-2 pl-3 pr-4 py-2 rounded-full bg-black/50 text-white text-sm font-semibold backdrop-blur-md hover:bg-black/70 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back
          </button>
          {reelsListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-center px-6">
              <i className="fa-solid fa-film text-gray-700 text-5xl mb-4" />
              <h2 className="text-2xl font-extrabold text-white mb-2">
                No video listings
              </h2>
              <p className="text-sm text-gray-400 mb-6 max-w-sm leading-relaxed">
                No video listings match your current filters.
              </p>
              <button
                onClick={clearAll}
                className="px-6 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-full hover:bg-gray-100 transition-colors"
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
          <div className="absolute top-0 left-0 h-full w-80 max-w-[90vw] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-extrabold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Close filters"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar
                filters={filters}
                onChange={handleChange}
                onClear={clearAll}
              />
            </div>
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors"
              >
                Show{" "}
                {results.length === 0 ? "no" : results.length.toLocaleString()}{" "}
                {results.length === 1 ? "result" : "results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
