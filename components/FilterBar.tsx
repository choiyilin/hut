"use client"

import { useState, useEffect, useRef } from "react"
import type { FilterState, BedFilter, BathFilter } from "@/types"
import { AMENITIES, BED_OPTIONS, BATH_OPTIONS, PRICE_PRESETS } from "./FilterSidebar"
import { NeighborhoodPicker } from "./NeighborhoodPicker"

// ── Shared hook ───────────────────────────────────────────────────────────────

function useDropdown(
  key: string,
  openId: string | null,
  setOpenId: (k: string | null) => void,
  panelRef: React.RefObject<HTMLDivElement | null>
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
      className={`flex items-center gap-1.5 h-10 px-4 rounded-full border-2 text-sm font-bold transition-all whitespace-nowrap ${
        dark
          ? "bg-gray-900 border-gray-900 text-white"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
      }`}
    >
      {label}
      {badgeCount > 0 && (
        <span
          className={`flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-extrabold ${
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

function DropdownPanel({
  children,
  wide,
}: {
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div
      className={`absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 ${
        wide ? "min-w-[300px]" : "min-w-[220px]"
      }`}
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
        <DropdownPanel wide>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Price range</p>
          <div className="flex gap-2 mb-3">
            {(["minPrice", "maxPrice"] as const).map((key) => (
              <div key={key} className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">
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
                  className="w-full pl-6 pr-2 py-2 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyOrClear(preset)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-colors ${
                  isPresetActive(preset)
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
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
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bedrooms</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {BED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleBed(opt.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-colors ${
                  filters.beds.includes(opt.value)
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bathrooms</p>
          <div className="flex flex-wrap gap-1.5">
            {BATH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleBath(opt.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-colors ${
                  filters.baths.includes(opt.value)
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
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
        <DropdownPanel wide>
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
  const isActive = filters.amenities.length > 0

  const toggleAmenity = (a: string) => {
    const next = filters.amenities.includes(a)
      ? filters.amenities.filter((x) => x !== a)
      : [...filters.amenities, a]
    onChange({ amenities: next })
  }

  return (
    <div ref={ref} className="relative">
      <PillButton
        label="Amenities"
        isOpen={isOpen}
        isActive={isActive}
        badgeCount={filters.amenities.length}
        onClick={toggle}
      />
      {isOpen && (
        <DropdownPanel>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Amenities</p>
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {AMENITIES.map((a) => (
              <label key={a} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.amenities.includes(a)}
                  onChange={() => toggleAmenity(a)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-900"
                />
                <span className="text-sm font-medium text-gray-700 capitalize group-hover:text-gray-900 transition-colors select-none">
                  {a}
                </span>
              </label>
            ))}
          </div>
        </DropdownPanel>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
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
    filters.amenities.length > 0

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <PriceDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      <BedsDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      <NeighborhoodsDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      <AmenitiesDropdown filters={filters} onChange={onChange} openId={openId} setOpenId={setOpenId} />
      {hasActive && (
        <button
          onClick={onClear}
          className="h-10 px-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
