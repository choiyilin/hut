import type { FilterState, BedFilter, BathFilter } from "@/schemas/filter-state"
import { countActiveFilters } from "@/domain/filter"
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
  return <h3 className="mb-3 text-sm font-bold text-gray-900">{children}</h3>
}

function Divider() {
  return <hr className="my-5 border-gray-100" />
}

// ── Main export ───────────────────────────────────────────────────────────────

type Props = {
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
      <div className="mb-5 flex items-center justify-between">
        <span className="text-base font-extrabold text-gray-900">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-200"
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
                onChange({
                  [key]: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              className="w-full rounded-xl border border-gray-200 py-2 pr-2 pl-6 text-sm font-medium transition-shadow placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyOrClearPreset(preset)}
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

      <Divider />

      {/* ── Beds ────────────────────────────────────────────────── */}
      <SectionLabel>Bedrooms</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
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

      <Divider />

      {/* ── Baths ───────────────────────────────────────────────── */}
      <SectionLabel>Bathrooms</SectionLabel>
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

      <Divider />

      {/* ── Amenities ───────────────────────────────────────────── */}
      <SectionLabel>Amenities</SectionLabel>

      <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Unit</p>
      <div className="mb-4 space-y-2">
        {["laundry in-unit", "dishwasher", "outdoor space", "central AC", "furnished"].map((a) => (
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

      <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Building</p>
      <div className="mb-4 space-y-2">
        {[
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
        ].map((a) => (
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

      <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">More</p>
      <div className="space-y-2">
        {["pets allowed", "accessible", "guarantors accepted"].map((a) => (
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

      <Divider />

      {/* ── More filters ─────────────────────────────────────────── */}
      <SectionLabel>More</SectionLabel>

      <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Move-in date</p>
      <input
        type="date"
        value={filters.moveInDate}
        onChange={(e) => onChange({ moveInDate: e.target.value })}
        className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
      />

      <p className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Building type</p>
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
    </div>
  )
}
