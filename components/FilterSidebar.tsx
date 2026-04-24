import type { FilterState, BedFilter, BathFilter } from "@/types"
import { countActiveFilters } from "@/types"
import { NeighborhoodPicker } from "./NeighborhoodPicker"

// ── Static data ───────────────────────────────────────────────────────────────

export const AMENITIES = [
  "laundry in-unit",
  "dishwasher",
  "outdoor space",
  "central AC",
  "furnished",
  "doorman",
  "elevator",
  "laundry in-building",
  "gym",
  "parking",
  "communal outdoor space",
  "swimming pool/sauna",
  "children's room",
  "smoke free",
  "storage",
  "pets allowed",
  "accessible",
  "guarantors accepted",
]

export const BED_OPTIONS: { label: string; value: BedFilter }[] = [
  { label: "Studio", value: "studio" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4+", value: "4+" },
]

export const BATH_OPTIONS: { label: string; value: BathFilter }[] = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
]

export const PRICE_PRESETS = [
  { label: "Under $2k", min: "" as const, max: 2000 },
  { label: "$2k–$3.5k", min: 2000, max: 3500 },
  { label: "$3.5k–$5k", min: 3500, max: 5000 },
  { label: "$5k+", min: 5000, max: "" as const },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-gray-900 mb-3">{children}</h3>
  )
}

function Divider() {
  return <hr className="border-gray-100 my-5" />
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  filters: FilterState
  onChange: (partial: Partial<FilterState>) => void
  onClear: () => void
}

export function FilterSidebar({ filters, onChange, onClear }: Props) {
  const toggleAmenity = (a: string) => {
    const next = filters.amenities.includes(a)
      ? filters.amenities.filter((x) => x !== a)
      : [...filters.amenities, a]
    onChange({ amenities: next })
  }

  const isPresetActive = (preset: (typeof PRICE_PRESETS)[number]) =>
    filters.minPrice === preset.min && filters.maxPrice === preset.max

  const applyOrClearPreset = (preset: (typeof PRICE_PRESETS)[number]) => {
    if (isPresetActive(preset)) {
      onChange({ minPrice: "", maxPrice: "" })
    } else {
      onChange({ minPrice: preset.min, maxPrice: preset.max })
    }
  }

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

  const hasActiveFilters = countActiveFilters(filters) > 0

  return (
    <div className="p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-base font-extrabold text-gray-900">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Neighborhood ────────────────────────────────────────── */}
      <SectionLabel>Neighborhood</SectionLabel>
      <NeighborhoodPicker
        selected={filters.neighborhoods}
        onChange={(neighborhoods) => onChange({ neighborhoods })}
      />

      <Divider />

      {/* ── Price ───────────────────────────────────────────────── */}
      <SectionLabel>Price</SectionLabel>
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
                onChange({
                  [key]: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full pl-6 pr-2 py-2 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-400 transition-shadow"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyOrClearPreset(preset)}
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

      <Divider />

      {/* ── Beds ────────────────────────────────────────────────── */}
      <SectionLabel>Bedrooms</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
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

      <Divider />

      {/* ── Baths ───────────────────────────────────────────────── */}
      <SectionLabel>Bathrooms</SectionLabel>
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

      <Divider />

      {/* ── Amenities ───────────────────────────────────────────── */}
      <SectionLabel>Amenities</SectionLabel>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Unit</p>
      <div className="space-y-2 mb-4">
        {["laundry in-unit", "dishwasher", "outdoor space", "central AC", "furnished"].map((a) => (
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

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Building</p>
      <div className="space-y-2 mb-4">
        {["doorman", "elevator", "laundry in-building", "gym", "parking", "communal outdoor space", "swimming pool/sauna", "children's room", "smoke free", "storage"].map((a) => (
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

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">More</p>
      <div className="space-y-2">
        {["pets allowed", "accessible", "guarantors accepted"].map((a) => (
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

      <Divider />

      {/* ── More filters ─────────────────────────────────────────── */}
      <SectionLabel>More</SectionLabel>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Move-in date</p>
      <input
        type="date"
        value={filters.moveInDate}
        onChange={(e) => onChange({ moveInDate: e.target.value })}
        className="w-full px-3 py-2 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 mb-4"
      />

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Building type</p>
      <div className="flex flex-wrap gap-1.5">
        {[
          { value: "rental", label: "Rental" },
          { value: "co-op", label: "Co-op" },
          { value: "condo", label: "Condo" },
          { value: "townhouse", label: "Townhouse" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              const next = filters.buildingType.includes(value)
                ? filters.buildingType.filter((x) => x !== value)
                : [...filters.buildingType, value]
              onChange({ buildingType: next })
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-full border-2 transition-colors ${
              filters.buildingType.includes(value)
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
