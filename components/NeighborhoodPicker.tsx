"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import dynamic from "next/dynamic"
import {
  NYC_BOROUGHS,
  ALL_NYC_NEIGHBORHOODS,
  type BoroughData,
  type NeighborhoodArea,
} from "@/data/nyc-neighborhoods"

const NeighborhoodMap = dynamic(() => import("./NeighborhoodMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
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
  const [first = "", second = ""] = selected
  if (selected.length === 0) return "All neighborhoods"
  if (selected.length === 1) return first
  if (selected.length === 2) return `${first}, ${second}`
  return `${first}, ${second} +${selected.length - 2}`
}

function areaNamesOf(area: NeighborhoodArea) {
  return area.neighborhoods.map((n) => n.name)
}

function boroughNamesOf(borough: BoroughData) {
  return borough.areas.flatMap(areaNamesOf)
}

// ── Public component ──────────────────────────────────────────────────────────

type Props = {
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
    [selected, onChange],
  )

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const unselected = ALL_NYC_NEIGHBORHOODS.filter((n) => !selected.includes(n))
    return unselected.filter((n) => n.toLowerCase().includes(q)).slice(0, 10)
  }, [search, selected])

  return (
    <>
      <div ref={containerRef} className="relative">
        {/* Bar */}
        <button
          onClick={() => setPickerOpen((p) => !p)}
          className={`flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${
            pickerOpen || selected.length > 0
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <i className="fa-solid fa-location-dot flex-shrink-0 text-sm text-gray-500" />
          <span
            className={`flex-1 truncate text-sm font-medium ${selected.length > 0 ? "text-gray-900" : "text-gray-400"}`}
          >
            {barLabel(selected)}
          </span>
          {selected.length > 0 && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
              className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
            >
              <i className="fa-solid fa-xmark text-[10px]" />
            </span>
          )}
          <i
            className={`fa-solid fa-chevron-down flex-shrink-0 text-[9px] text-gray-400 transition-transform duration-150 ${pickerOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Picker popup */}
        {pickerOpen && (
          <div className="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 p-3">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search neighborhoods…"
                  className="w-full rounded-lg border border-gray-200 py-2 pr-3 pl-8 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 focus:outline-none"
                />
              </div>
            </div>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-3 pt-2.5 pb-2">
                {selected.map((n) => (
                  <button
                    key={n}
                    onClick={() => toggle(n)}
                    className="flex items-center gap-1.5 rounded-full bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-gray-700"
                  >
                    {n}
                    <i className="fa-solid fa-xmark text-[9px]" />
                  </button>
                ))}
              </div>
            )}
            {search.trim() && (
              <div className="max-h-44 overflow-y-auto">
                {suggestions.length === 0 ? (
                  <p className="px-3 py-3 text-center text-xs text-gray-400">
                    No results for &ldquo;{search}&rdquo;
                  </p>
                ) : (
                  suggestions.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        toggle(n)
                        setSearch("")
                      }}
                      className="w-full px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      {n}
                    </button>
                  ))
                )}
              </div>
            )}
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={() => {
                  setBrowserOpen(true)
                  setPickerOpen(false)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-700"
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
    (n: string) =>
      onChange(selected.includes(n) ? selected.filter((x) => x !== n) : [...selected, n]),
    [selected, onChange],
  )

  const toggleArea = useCallback(
    (area: NeighborhoodArea) => {
      const names = areaNamesOf(area)
      const allIn = names.every((n) => selected.includes(n))
      onChange(
        allIn ? selected.filter((n) => !names.includes(n)) : [...new Set([...selected, ...names])],
      )
    },
    [selected, onChange],
  )

  const toggleBorough = useCallback(
    (borough: BoroughData) => {
      const names = boroughNamesOf(borough)
      const allIn = names.every((n) => selected.includes(n))
      onChange(
        allIn ? selected.filter((n) => !names.includes(n)) : [...new Set([...selected, ...names])],
      )
    },
    [selected, onChange],
  )

  const currentBorough = NYC_BOROUGHS.find((b) => b.id === activeBorough)!

  return (
    <div data-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Browse Neighborhoods</h2>
            {selected.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-xs font-semibold text-blue-600 transition-colors hover:text-blue-800"
              >
                Clear all ({selected.length})
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Map — 33% */}
          <div className="w-[33%] flex-shrink-0 border-r border-gray-200">
            <NeighborhoodMap
              selected={selected}
              onToggle={toggle}
              allCuratedNames={ALL_NYC_NEIGHBORHOODS}
            />
          </div>

          {/* Right panel — 67% */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* ── Borough tab bar ── */}
            <div className="flex flex-shrink-0 overflow-x-auto border-b border-gray-200">
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
                    className={`flex flex-shrink-0 items-center gap-2 border-r border-gray-200 px-3 py-3 text-[11px] font-bold tracking-wider whitespace-nowrap transition-colors ${
                      isActive
                        ? "-mb-px border-b-2 border-b-blue-600 bg-white text-gray-900"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    }`}
                  >
                    <IndeterminateCheckbox
                      checked={allIn}
                      indeterminate={someIn}
                      onChange={() => toggleBorough(borough)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-blue-600"
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
                    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                      <IndeterminateCheckbox
                        checked={allIn}
                        indeterminate={someIn}
                        onChange={() => toggleArea(area)}
                        className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-blue-600"
                      />
                      <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                        ALL {area.area.toUpperCase()}
                      </span>
                    </div>

                    {/* 3-col grid */}
                    <div className="grid grid-cols-3">
                      {area.neighborhoods.map((n) => (
                        <label
                          key={n.name}
                          className={`flex cursor-pointer items-center gap-2.5 border-r border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                            n.sub ? "py-2 pr-3 pl-8" : "px-4 py-2"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(n.name)}
                            onChange={() => toggle(n.name)}
                            className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer accent-blue-600"
                          />
                          <span className="text-xs leading-tight text-gray-700 select-none">
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
        <div className="flex flex-shrink-0 items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3.5">
          <p className="text-sm text-gray-500">
            {selected.length === 0
              ? "No neighborhoods selected"
              : `${selected.length} neighborhood${selected.length !== 1 ? "s" : ""} selected`}
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
