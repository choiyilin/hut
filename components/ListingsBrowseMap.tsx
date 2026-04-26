"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

import { clientEnv } from "@/env/client"
import { geoListings as filterGeoListings, pickFitTarget } from "@/domain/map-fit"
import type { Listing } from "@/types"

const NYC_BOUNDS: [[number, number], [number, number]] = [
  [-74.259, 40.477],
  [-73.7, 40.917],
]

// Debounce window for camera moves. The map fits as filters change, but a
// keystroke-by-keystroke search would otherwise stack many overlapping
// flyTo animations. 220ms feels responsive but coalesces a fast typist's
// burst of input into one move.
const FIT_DEBOUNCE_MS = 220

type Props = {
  listings: Listing[]
}

// ── Price pill marker ────────────────────────────────────────────────────────

function PricePill({ price, selected }: { price: number; selected: boolean }) {
  const label = price >= 1000 ? `$${Math.round(price / 1000)}k` : `$${price}`
  return (
    <div
      className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap shadow-md transition-all duration-150 select-none ${
        selected
          ? "scale-110 bg-[#c9a96e] text-gray-900 shadow-lg ring-2 ring-white"
          : "bg-gray-900 text-white hover:scale-105 hover:bg-gray-700"
      }`}
    >
      {label}
    </div>
  )
}

// ── Mini card shown in popup ─────────────────────────────────────────────────

function MiniCard({ listing }: { listing: Listing }) {
  const bedLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bd`

  return (
    <a
      href={`/listings/${listing.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block no-underline"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[220px]">
        <div className="relative h-[148px] overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {listing.featured && (
            <span className="absolute top-2 left-2 rounded-full bg-[#c9a96e] px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-gray-900 uppercase">
              ★ Featured
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="mb-0.5 flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-900">
              ${listing.price.toLocaleString()}
            </span>
            {listing.listingType !== "sale" && (
              <span className="text-[11px] font-medium text-gray-400">/mo</span>
            )}
          </div>
          <p className="mb-2 truncate text-[11px] font-medium text-gray-500">{listing.title}</p>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
              {bedLabel}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
              {listing.baths} ba
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
              {listing.sqft.toLocaleString()} ft²
            </span>
          </div>
          <p className="mt-2 text-[10px] font-semibold text-[#c9a96e] group-hover:underline">
            View listing →
          </p>
        </div>
      </div>
    </a>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export function ListingsBrowseMap({ listings }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const geoListings = useMemo(() => filterGeoListings(listings), [listings])

  const selected = useMemo(
    () => geoListings.find((l) => l.id === selectedId) ?? null,
    [geoListings, selectedId],
  )

  // Drop the selection only when the previously-selected pin is no longer in
  // the new result set. Plain "clear on every listings change" was too
  // aggressive — a re-fetch that returned the same listings would close the
  // popup mid-read.
  useEffect(() => {
    if (selectedId === null) return
    const stillVisible = geoListings.some((l) => l.id === selectedId)
    if (!stillVisible) setSelectedId(null)
  }, [geoListings, selectedId])

  // Debounce the camera fit so a burst of filter changes coalesces into one
  // animation instead of stacking overlapping flyTo calls.
  useEffect(() => {
    const map = mapRef.current
    if (!map?.loaded()) return

    const handle = window.setTimeout(() => {
      applyFit(map, geoListings)
    }, FIT_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(handle)
    }
  }, [geoListings])

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: 40.732, longitude: -73.998, zoom: 11.4 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: "100%", height: "100%" }}
      reuseMaps
      onLoad={() => {
        const map = mapRef.current
        if (map) applyFit(map, geoListings)
      }}
      onClick={() => setSelectedId(null)}
    >
      <NavigationControl position="top-right" />

      {geoListings.map((listing) => (
        <Marker
          key={listing.id}
          longitude={listing.lng}
          latitude={listing.lat}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelectedId((prev) => (prev === listing.id ? null : listing.id))
          }}
        >
          <PricePill price={listing.price} selected={selectedId === listing.id} />
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          anchor="bottom"
          offset={[0, -30] as [number, number]}
          closeButton={false}
          onClose={() => setSelectedId(null)}
          className="hut-map-popup"
          maxWidth="none"
        >
          <MiniCard listing={selected} />
        </Popup>
      )}
    </Map>
  )
}

function applyFit(map: MapRef, listings: readonly Listing[]): void {
  const target = pickFitTarget(listings)
  switch (target.kind) {
    case "default-bounds":
      map.fitBounds(NYC_BOUNDS, { padding: 40, duration: 700 })
      return
    case "single":
      map.flyTo({
        center: [target.center[0], target.center[1]],
        zoom: 15,
        duration: 700,
      })
      return
    case "bounds":
      map.fitBounds(
        [
          [target.southwest[0], target.southwest[1]],
          [target.northeast[0], target.northeast[1]],
        ],
        { padding: 64, maxZoom: 15, duration: 700 },
      )
      return
  }
}

export default ListingsBrowseMap
