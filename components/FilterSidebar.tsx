import type { FilterState, BedFilter, BathFilter } from "@/types"

// ── Static data ───────────────────────────────────────────────────────────────

export const NEIGHBORHOODS = [
  "Park Slope",
  "Williamsburg",
  "Bushwick",
  "Upper West Side",
  "East Village",
  "Astoria",
  "Chelsea",
  "Harlem",
  "DUMBO",
  "Lower East Side",
]

export const AMENITIES = [
  "doorman",
  "laundry in-unit",
  "laundry in-building",
  "elevator",
  "pets allowed",
  "rooftop",
  "gym",
  "dishwasher",
  "central AC",
  "parking",
  "balcony",
  "storage",
  "accessible",
  "furnished",
  "outdoor space",
  "live-in super",
  "bike room",
  "pool",
]

const BED_OPTIONS: { label: string; value: BedFilter }[] = [
  { label: "Any", value: "any" },
  { label: "Studio", value: "studio" },
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4+", value: "4+" },
]

const BATH_OPTIONS: { label: string; value: BathFilter }[] = [
  { label: "Any", value: "any" },
  { label: "1", value: "1" },
  { label: "2+", value: "2+" },
]

const PRICE_PRESETS = [
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
  resultCount: number
}

export function FilterSidebar({ filters, onChange, onClear, resultCount }: Props) {
  void resultCount

  const toggleNeighborhood = (n: string) => {
    const next = filters.neighborhoods.includes(n)
      ? filters.neighborhoods.filter((x) => x !== n)
      : [...filters.neighborhoods, n]
    onChange({ neighborhoods: next })
  }

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

  const hasActiveFilters =
    filters.neighborhoods.length > 0 ||
    filters.minPrice !== "" ||
    filters.maxPrice !== "" ||
    filters.beds !== "any" ||
    filters.baths !== "any" ||
    filters.amenities.length > 0 ||
    filters.search.trim().length > 0

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
      <div className="space-y-2">
        {NEIGHBORHOODS.map((n) => (
          <label
            key={n}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={filters.neighborhoods.includes(n)}
              onChange={() => toggleNeighborhood(n)}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gray-900"
            />
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors select-none">
              {n}
            </span>
          </label>
        ))}
      </div>

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
      <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
        {BED_OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => onChange({ beds: opt.value })}
            className={[
              "flex-1 py-2.5 text-xs font-bold transition-colors",
              i < BED_OPTIONS.length - 1 ? "border-r-2 border-gray-200" : "",
              filters.beds === opt.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Baths ───────────────────────────────────────────────── */}
      <SectionLabel>Bathrooms</SectionLabel>
      <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
        {BATH_OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => onChange({ baths: opt.value })}
            className={[
              "flex-1 py-2.5 text-xs font-bold transition-colors",
              i < BATH_OPTIONS.length - 1 ? "border-r-2 border-gray-200" : "",
              filters.baths === opt.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Divider />

      {/* ── Amenities ───────────────────────────────────────────── */}
      <SectionLabel>Amenities</SectionLabel>
      <div className="space-y-2">
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
    </div>
  )
}
