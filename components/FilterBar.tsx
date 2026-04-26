"use client"

import { useState, useEffect, useRef } from "react"
import type { FilterState, BedFilter, BathFilter } from "@/schemas/filter-state"
import { BED_OPTIONS, BATH_OPTIONS, PRICE_PRESETS } from "./FilterSidebar"
import { NeighborhoodPicker } from "./NeighborhoodPicker"

// ── Amenity groupings ─────────────────────────────────────────────────────────

const UNIT_FEATURED = [
  { value: "laundry in-unit", label: "Washer/dryer", icon: "fa-shirt" },
  { value: "dishwasher", label: "Dishwasher", icon: "fa-utensils" },
  { value: "outdoor space", label: "Outdoor space", icon: "fa-leaf" },
]

const UNIT_EXTRA = ["central AC", "furnished"]

const BUILDING_FEATURED = [
  { value: "doorman", label: "Doorman", icon: "fa-user-tie" },
  { value: "elevator", label: "Elevator", icon: "fa-elevator" },
  { value: "laundry in-building", label: "In-building laundry", icon: "fa-building" },
]

const BUILDING_EXTRA = [
  "gym",
  "parking",
  "communal outdoor space",
  "swimming pool/sauna",
  "children's room",
  "smoke free",
  "storage",
]

const MORE_AMENITIES = ["pets allowed", "accessible", "guarantors accepted"]

const AMENITIES_PILL_SET = new Set([
  ...UNIT_FEATURED.map((x) => x.value),
  ...UNIT_EXTRA,
  ...BUILDING_FEATURED.map((x) => x.value),
  ...BUILDING_EXTRA,
])

const BUILDING_TYPES = [
  { value: "rental", label: "Rental building" },
  { value: "co-op", label: "Co-op" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
]

// ── Shared hook ───────────────────────────────────────────────────────────────

function useDropdown(
  key: string,
  openId: string | null,
  setOpenId: (k: string | null) => void,
  panelRef: React.RefObject<HTMLDivElement | null>,
) {
  const isOpen = openId === key

  useEffect(() => {
    if (!isOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest("[data-modal]")) return
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpenId(null)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenId(null)
    }
    document.addEventListener("mousedown", onMouseDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onMouseDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isOpen, panelRef, setOpenId])

  return {
    isOpen,
    toggle: () => setOpenId(isOpen ? null : key),
  }
}

// ── PillButton ────────────────────────────────────────────────────────────────

function PillButton({
  label,
  isOpen,
  isActive,
  badgeCount,
  onClick,
}: {
  label: string
  isOpen: boolean
  isActive: boolean
  badgeCount: number
  onClick: () => void
}) {
  const dark = isActive || isOpen
  return (
    <button
      onClick={onClick}
      className={`flex h-10 items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold whitespace-nowrap transition-all ${
        dark
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
      }`}
    >
      {label}
      {badgeCount > 0 && (
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
            dark ? "bg-white text-gray-900" : "bg-gray-900 text-white"
          }`}
        >
          {badgeCount}
        </span>
      )}
      <i
        className={`fa-solid fa-chevron-down text-[9px] transition-transform duration-150 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  )
}

// ── DropdownPanel ─────────────────────────────────────────────────────────────

function DropdownPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`absolute top-full left-0 z-50 mt-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl ${className ?? "min-w-[220px]"}`}
    >
      {children}
    </div>
  )
}

// ── PriceDropdown ─────────────────────────────────────────────────────────────

function PriceDropdown({
  filters,
  onChange,
  openId,
  setOpenId,
}: {
  filters: FilterState
  onChange: (p: Partial<FilterState>) => void
  openId: string | null
  setOpenId: (k: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { isOpen, toggle } = useDropdown("price", openId, setOpenId, ref)
  const isActive = filters.minPrice !== "" || filters.maxPrice !== ""

  const isPresetActive = (preset: (typeof PRICE_PRESETS)[number]) =>
    filters.minPrice === preset.min && filters.maxPrice === preset.max

  const applyOrClear = (preset: (typeof PRICE_PRESETS)[number]) => {
    if (isPresetActive(preset)) {
      onChange({ minPrice: "", maxPrice: "" })
    } else {
      onChange({ minPrice: preset.min, maxPrice: preset.max })
    }
  }

  return (
    <div ref={ref} className="relative">
      <PillButton
        label="Price"
        isOpen={isOpen}
        isActive={isActive}
        badgeCount={isActive ? 1 : 0}
        onClick={toggle}
      />
      {isOpen && (
        <DropdownPanel className="min-w-[300px]">
          <p className="mb-3 text-xs font-bold tracking-wider text-gray-500 uppercase">
            Price range
          </p>
          <div className="mb-3 flex gap-2">
            {(["minPrice", "maxPrice"] as const).map((key) => (
              <div key={key} className="relative flex-1">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  placeholder={key === "minPrice" ? "Min" : "Max"}
                  value={filters[key]}
                  min={0}
                  onChange={(e) =>
                    onChange({ [key]: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-gray-200 py-2 pr-2 pl-6 text-sm font-medium placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyOrClear(preset)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                  isPresetActive(preset)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}
    </div>
  )
}

// ── BedsDropdown ──────────────────────────────────────────────────────────────

function BedsDropdown({
  filters,
  onChange,
  openId,
  setOpenId,
}: {
  filters: FilterState
  onChange: (p: Partial<FilterState>) => void
  openId: string | null
  setOpenId: (k: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { isOpen, toggle } = useDropdown("beds", openId, setOpenId, ref)
  const isActive = filters.beds.length > 0 || filters.baths.length > 0
  const badgeCount = filters.beds.length + filters.baths.length

  const toggleBed = (v: BedFilter) => {
    const next = filters.beds.includes(v)
      ? filters.beds.filter((x) => x !== v)
      : [...filters.beds, v]
    onChange({ beds: next })
  }

  const toggleBath = (v: BathFilter) => {
    const next = filters.baths.includes(v)
      ? filters.baths.filter((x) => x !== v)
      : [...filters.baths, v]
    onChange({ baths: next })
  }

  return (
    <div ref={ref} className="relative">
      <PillButton
        label="Beds / Baths"
        isOpen={isOpen}
        isActive={isActive}
        badgeCount={badgeCount}
        onClick={toggle}
      />
      {isOpen && (
        <DropdownPanel>
          <p className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">Bedrooms</p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {BED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleBed(opt.value)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                  filters.beds.includes(opt.value)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">Bathrooms</p>
          <div className="flex flex-wrap gap-1.5">
            {BATH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleBath(opt.value)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                  filters.baths.includes(opt.value)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </DropdownPanel>
      )}
    </div>
  )
}

// ── NeighborhoodsDropdown ─────────────────────────────────────────────────────

function NeighborhoodsDropdown({
  filters,
  onChange,
  openId,
  setOpenId,
}: {
  filters: FilterState
  onChange: (p: Partial<FilterState>) => void
  openId: string | null
  setOpenId: (k: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { isOpen, toggle } = useDropdown("neighborhoods", openId, setOpenId, ref)
  const isActive = filters.neighborhoods.length > 0

  return (
    <div ref={ref} className="relative">
      <PillButton
        label="Neighborhoods"
        isOpen={isOpen}
        isActive={isActive}
        badgeCount={filters.neighborhoods.length}
        onClick={toggle}
      />
      {isOpen && (
        <DropdownPanel className="min-w-[300px]">
          <NeighborhoodPicker
            selected={filters.neighborhoods}
            onChange={(neighborhoods) => onChange({ neighborhoods })}
          />
        </DropdownPanel>
      )}
    </div>
  )
}

// ── AmenitiesDropdown ─────────────────────────────────────────────────────────

function AmenitiesDropdown({
  filters,
  onChange,
  openId,
  setOpenId,
}: {
  filters: FilterState
  onChange: (p: Partial<FilterState>) => void
  openId: string | null
  setOpenId: (k: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { isOpen, toggle } = useDropdown("amenities", openId, setOpenId, ref)
  const [showMoreUnit, setShowMoreUnit] = useState(false)
  const [showMoreBuilding, setShowMoreBuilding] = useState(false)

  const amenitiesBadge = filters.amenities.filter((a) => AMENITIES_PILL_SET.has(a)).length
  const isActive = amenitiesBadge > 0

  const toggleAmenity = (a: string) => {
    const next = filters.amenities.includes(a)
      ? filters.amenities.filter((x) => x !== a)
      : [...filters.amenities, a]
    onChange({ amenities: next })
  }

  const resetAmenitiesSection = () => {
    onChange({ amenities: filters.amenities.filter((a) => !AMENITIES_PILL_SET.has(a)) })
  }

  return (
    <div ref={ref} className="relative">
      <PillButton
        label="Amenities"
        isOpen={isOpen}
        isActive={isActive}
        badgeCount={amenitiesBadge}
        onClick={toggle}
      />
      {isOpen && (
        <DropdownPanel className="w-[320px]">
          <p className="mb-4 text-xs leading-relaxed text-gray-500">
            Being flexible on amenities will display more huts.
          </p>

          {/* Unit section */}
          <p className="mb-2 text-sm font-extrabold text-gray-900">Unit</p>
          <div className="mb-2 space-y-1.5">
            {UNIT_FEATURED.map(({ value, label, icon }) => {
              const selected = filters.amenities.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleAmenity(value)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <i
                    className={`fa-solid ${icon} w-4 text-center ${
                      selected ? "text-white" : "text-gray-400"
                    }`}
                  />
                  {label}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setShowMoreUnit((v) => !v)}
            className="mb-3 flex items-center gap-1 text-xs font-bold tracking-wider text-gray-500 uppercase transition-colors hover:text-gray-900"
          >
            Show more
            <i
              className={`fa-solid fa-chevron-down text-[9px] transition-transform ${showMoreUnit ? "rotate-180" : ""}`}
            />
          </button>
          {showMoreUnit && (
            <div className="mb-4 space-y-2">
              {UNIT_EXTRA.map((a) => (
                <label key={a} className="group flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize transition-colors select-none group-hover:text-gray-900">
                    {a}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="my-1 border-t border-gray-100" />

          {/* Building section */}
          <p className="mt-3 mb-2 text-sm font-extrabold text-gray-900">Building</p>
          <div className="mb-2 space-y-1.5">
            {BUILDING_FEATURED.map(({ value, label, icon }) => {
              const selected = filters.amenities.includes(value)
              return (
                <button
                  key={value}
                  onClick={() => toggleAmenity(value)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                    selected
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <i
                    className={`fa-solid ${icon} w-4 text-center ${
                      selected ? "text-white" : "text-gray-400"
                    }`}
                  />
                  {label}
                </button>
              )
            })}
          </div>
          <button
            onClick={() => setShowMoreBuilding((v) => !v)}
            className="mb-3 flex items-center gap-1 text-xs font-bold tracking-wider text-gray-500 uppercase transition-colors hover:text-gray-900"
          >
            Show more
            <i
              className={`fa-solid fa-chevron-down text-[9px] transition-transform ${showMoreBuilding ? "rotate-180" : ""}`}
            />
          </button>
          {showMoreBuilding && (
            <div className="mb-3 space-y-2">
              {BUILDING_EXTRA.map((a) => (
                <label key={a} className="group flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize transition-colors select-none group-hover:text-gray-900">
                    {a}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              onClick={resetAmenitiesSection}
              className="text-sm font-bold text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-900"
            >
              Reset
            </button>
            <button
              onClick={() => setOpenId(null)}
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-700"
            >
              Done
            </button>
          </div>
        </DropdownPanel>
      )}
    </div>
  )
}

// ── MoreDropdown ──────────────────────────────────────────────────────────────

function MoreDropdown({
  filters,
  onChange,
  openId,
  setOpenId,
}: {
  filters: FilterState
  onChange: (p: Partial<FilterState>) => void
  openId: string | null
  setOpenId: (k: string | null) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { isOpen, toggle } = useDropdown("more", openId, setOpenId, ref)

  const moreAmenityCount = filters.amenities.filter((a) => MORE_AMENITIES.includes(a)).length
  const badgeCount = (filters.moveInDate ? 1 : 0) + filters.buildingType.length + moreAmenityCount
  const isActive = badgeCount > 0

  const toggleAmenity = (a: string) => {
    const next = filters.amenities.includes(a)
      ? filters.amenities.filter((x) => x !== a)
      : [...filters.amenities, a]
    onChange({ amenities: next })
  }

  const toggleBuildingType = (v: string) => {
    const next = filters.buildingType.includes(v)
      ? filters.buildingType.filter((x) => x !== v)
      : [...filters.buildingType, v]
    onChange({ buildingType: next })
  }

  const resetMore = () => {
    onChange({
      moveInDate: "",
      buildingType: [],
      amenities: filters.amenities.filter((a) => !MORE_AMENITIES.includes(a)),
    })
  }

  return (
    <div ref={ref} className="relative">
      <PillButton
        label="More"
        isOpen={isOpen}
        isActive={isActive}
        badgeCount={badgeCount}
        onClick={toggle}
      />
      {isOpen && (
        <DropdownPanel className="w-[300px]">
          {/* Move-in date */}
          <p className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
            Move-in date
          </p>
          <input
            type="date"
            value={filters.moveInDate}
            onChange={(e) => onChange({ moveInDate: e.target.value })}
            className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
          />

          {/* Building type */}
          <p className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">
            Building type
          </p>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {BUILDING_TYPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => toggleBuildingType(value)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-bold transition-colors ${
                  filters.buildingType.includes(value)
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Additional amenities */}
          <p className="mb-2 text-xs font-bold tracking-wider text-gray-500 uppercase">Amenities</p>
          <div className="mb-4 space-y-2">
            {MORE_AMENITIES.map((a) => (
              <label key={a} className="group flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-gray-900"
                />
                <span className="text-sm font-medium text-gray-700 capitalize transition-colors select-none group-hover:text-gray-900">
                  {a}
                </span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              onClick={resetMore}
              className="text-sm font-bold text-gray-500 underline underline-offset-2 transition-colors hover:text-gray-900"
            >
              Reset
            </button>
            <button
              onClick={() => setOpenId(null)}
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-gray-700"
            >
              Done
            </button>
          </div>
        </DropdownPanel>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

type Props = {
  filters: FilterState
  onChange: (partial: Partial<FilterState>) => void
  onClear: () => void
}

export function FilterBar({ filters, onChange, onClear }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  const hasActive =
    filters.neighborhoods.length > 0 ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.beds.length > 0 ||
    filters.baths.length > 0 ||
    filters.amenities.length > 0 ||
    Boolean(filters.moveInDate) ||
    filters.buildingType.length > 0

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PriceDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      <BedsDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      <NeighborhoodsDropdown
        filters={filters}
        onChange={onChange}
        openId={openId}
        setOpenId={setOpenId}
      />
      <AmenitiesDropdown
        filters={filters}
        onChange={onChange}
        openId={openId}
        setOpenId={setOpenId}
      />
      <MoreDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      {hasActive && (
        <button
          onClick={onClear}
          className="h-10 px-4 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
