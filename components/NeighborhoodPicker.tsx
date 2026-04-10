"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import { NYC_BOROUGHS, ALL_NYC_NEIGHBORHOODS, type BoroughData, type NeighborhoodArea } from "@/data/nyc-neighborhoods"

const NeighborhoodMap = dynamic(() => import("./NeighborhoodMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <p className="text-sm text-gray-400">Loading map…</p>
    </div>
  ),
})

// ── Portal ────────────────────────────────────────────────────────────────────

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, document.body)
}

// ── IndeterminateCheckbox ─────────────────────────────────────────────────────

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
  onClick,
  className,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
  onClick?: (e: React.MouseEvent) => void
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !checked && !!indeterminate
  }, [checked, indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      className={className}
    />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function barLabel(selected: string[]): string {
  if (selected.length === 0) return "All neighborhoods"
  if (selected.length === 1) return selected[0]
  if (selected.length === 2) return `${selected[0]}, ${selected[1]}`
  return `${selected[0]}, ${selected[1]} +${selected.length - 2}`
}

function areaNamesOf(area: NeighborhoodArea) {
  return area.neighborhoods.map((n) => n.name)
}

function boroughNamesOf(borough: BoroughData) {
  return borough.areas.flatMap(areaNamesOf)
}

// ── Public component ──────────────────────────────────────────────────────────

interface Props {
  selected: string[]
  onChange: (neighborhoods: string[]) => void
}

export function NeighborhoodPicker({ selected, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pickerOpen) return
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [pickerOpen])

  useEffect(() => {
    if (pickerOpen) setTimeout(() => searchRef.current?.focus(), 40)
    else setSearch("")
  }, [pickerOpen])

  const toggle = useCallback(
    (n: string) =>
      onChange(selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n]),
    [selected, onChange]
  )

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    const unselected = ALL_NYC_NEIGHBORHOODS.filter((n) => !selected.includes(n))
    if (!q) return unselected.slice(0, 10)
    return unselected.filter((n) => n.toLowerCase().includes(q)).slice(0, 10)
  }, [search, selected])

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Bar */}
        <button
          onClick={() => setPickerOpen((p) => !p)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
            pickerOpen || selected.length > 0
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <i className="fa-solid fa-location-dot text-gray-500 flex-shrink-0 text-sm" />
          <span className={`flex-1 truncate text-sm font-medium ${selected.length > 0 ? "text-gray-900" : "text-gray-400"}`}>
            {barLabel(selected)}
          </span>
          {selected.length > 0 && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange([]) }}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-[10px]" />
            </span>
          )}
          <i className={`fa-solid fa-chevron-down text-gray-400 text-[9px] flex-shrink-0 transition-transform duration-150 ${pickerOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Picker popup */}
        {pickerOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search neighborhoods…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 placeholder:text-gray-400"
                />
              </div>
            </div>
            {selected.length > 0 && (
              <div className="px-3 pt-2.5 pb-2 flex flex-wrap gap-1.5 border-b border-gray-100">
                {selected.map((n) => (
                  <button
                    key={n}
                    onClick={() => toggle(n)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-full hover:bg-gray-700 transition-colors"
                  >
                    {n}
                    <i className="fa-solid fa-xmark text-[9px]" />
                  </button>
                ))}
              </div>
            )}
            <div className="max-h-44 overflow-y-auto">
              {suggestions.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400 text-center">No results for &ldquo;{search}&rdquo;</p>
              ) : (
                suggestions.map((n) => (
                  <button
                    key={n}
                    onClick={() => { toggle(n); setSearch("") }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    {n}
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => { setBrowserOpen(true); setPickerOpen(false) }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-700 transition-colors"
              >
                <i className="fa-solid fa-map text-xs" />
                Browse by map
              </button>
            </div>
          </div>
        )}
      </div>

      <Portal>
        {browserOpen && (
          <NeighborhoodBrowser
            selected={selected}
            onChange={onChange}
            onClose={() => setBrowserOpen(false)}
          />
        )}
      </Portal>
    </>
  )
}

// ── Browser modal ─────────────────────────────────────────────────────────────

function NeighborhoodBrowser({
  selected,
  onChange,
  onClose,
}: {
  selected: string[]
  onChange: (neighborhoods: string[]) => void
  onClose: () => void
}) {
  const [activeBorough, setActiveBorough] = useState<BoroughData["id"]>("MANHATTAN")

  const toggle = useCallback(
    (n: string) => onChange(selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n]),
    [selected, onChange]
  )

  const toggleArea = useCallback(
    (area: NeighborhoodArea) => {
      const names = areaNamesOf(area)
      const allIn = names.every((n) => selected.includes(n))
      onChange(
        allIn
          ? selected.filter((n) => !names.includes(n))
          : [...new Set([...selected, ...names])]
      )
    },
    [selected, onChange]
  )

  const toggleBorough = useCallback(
    (borough: BoroughData) => {
      const names = boroughNamesOf(borough)
      const allIn = names.every((n) => selected.includes(n))
      onChange(
        allIn
          ? selected.filter((n) => !names.includes(n))
          : [...new Set([...selected, ...names])]
      )
    },
    [selected, onChange]
  )

  const currentBorough = NYC_BOROUGHS.find((b) => b.id === activeBorough)!

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Browse Neighborhoods</h2>
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-xs text-blue-600 font-semibold hover:text-blue-800 transition-colors"
              >
                Clear all ({selected.length})
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* Map — 33% */}
          <div className="w-[33%] flex-shrink-0 border-r border-gray-200">
            <NeighborhoodMap
              selected={selected}
              onToggle={toggle}
              allCuratedNames={ALL_NYC_NEIGHBORHOODS}
            />
          </div>

          {/* Right panel — 67% */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── Borough tab bar ── */}
            <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
              {NYC_BOROUGHS.map((borough) => {
                const names = boroughNamesOf(borough)
                const selectedCount = names.filter((n) => selected.includes(n)).length
                const allIn = selectedCount === names.length
                const someIn = selectedCount > 0 && !allIn
                const isActive = activeBorough === borough.id

                return (
                  <button
                    key={borough.id}
                    onClick={() => setActiveBorough(borough.id)}
                    className={`flex items-center gap-2 px-3 py-3 border-r border-gray-200 whitespace-nowrap text-[11px] font-bold tracking-wider transition-colors flex-shrink-0 ${
                      isActive
                        ? "bg-white text-gray-900 border-b-2 border-b-blue-600 -mb-px"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <IndeterminateCheckbox
                      checked={allIn}
                      indeterminate={someIn}
                      onChange={() => toggleBorough(borough)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                    {borough.label}
                  </button>
                )
              })}
            </div>

            {/* ── Neighborhood grid ── */}
            <div className="flex-1 overflow-y-scroll">
              {currentBorough.areas.map((area) => {
                const names = areaNamesOf(area)
                const selectedCount = names.filter((n) => selected.includes(n)).length
                const allIn = selectedCount === names.length
                const someIn = selectedCount > 0 && !allIn

                return (
                  <div key={area.area}>
                    {/* Area header */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                      <IndeterminateCheckbox
                        checked={allIn}
                        indeterminate={someIn}
                        onChange={() => toggleArea(area)}
                        className="w-3.5 h-3.5 accent-blue-600 cursor-pointer flex-shrink-0"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        ALL {area.area.toUpperCase()}
                      </span>
                    </div>

                    {/* 3-col grid */}
                    <div className="grid grid-cols-3">
                      {area.neighborhoods.map((n) => (
                        <label
                          key={n.name}
                          className={`flex items-center gap-2.5 border-b border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                            n.sub ? "pl-8 pr-3 py-2" : "px-4 py-2"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(n.name)}
                            onChange={() => toggle(n.name)}
                            className="w-3.5 h-3.5 accent-blue-600 cursor-pointer flex-shrink-0"
                          />
                          <span className="text-xs text-gray-700 leading-tight select-none">
                            {n.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <p className="text-sm text-gray-500">
            {selected.length === 0
              ? "No neighborhoods selected"
              : `${selected.length} neighborhood${selected.length !== 1 ? "s" : ""} selected`}
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
