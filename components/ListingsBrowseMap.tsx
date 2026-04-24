"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import type { Listing } from "@/types"
import "mapbox-gl/dist/mapbox-gl.css"

import { clientEnv } from "@/env/client"

const NYC_BOUNDS: [[number, number], [number, number]] = [
  [-74.259, 40.477],
  [-73.7, 40.917],
]

interface Props {
  listings: Listing[]
}

// ── Price pill marker ────────────────────────────────────────────────────────

function PricePill({
  price,
  selected,
}: {
  price: number
  selected: boolean
}) {
  const label = price >= 1000 ? `$${Math.round(price / 1000)}k` : `$${price}`
  return (
    <div
      className={`
        px-2.5 py-1 rounded-full text-xs font-bold shadow-md cursor-pointer
        select-none transition-all duration-150 whitespace-nowrap
        ${
          selected
            ? "bg-[#c9a96e] text-gray-900 shadow-lg scale-110 ring-2 ring-white"
            : "bg-gray-900 text-white hover:bg-gray-700 hover:scale-105"
        }
      `}
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
      className="block no-underline group"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[220px]">
        <div className="relative h-[148px] overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {listing.featured && (
            <span className="absolute top-2 left-2 bg-[#c9a96e] text-gray-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
              ★ Featured
            </span>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-sm font-bold text-gray-900">
              ${listing.price.toLocaleString()}
            </span>
            {listing.listingType !== "sale" && (
              <span className="text-[11px] text-gray-400 font-medium">/mo</span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 font-medium truncate mb-2">
            {listing.title}
          </p>
          <div className="flex gap-1 flex-wrap">
            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {bedLabel}
            </span>
            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {listing.baths} ba
            </span>
            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
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

  // Only listings with real geocoordinates (AddListingForm defaults to 0,0)
  const geoListings = useMemo(
    () => listings.filter((l) => l.lat !== 0 && l.lng !== 0),
    [listings]
  )

  const selected = geoListings.find((l) => l.id === selectedId) ?? null

  const fitBounds = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    if (geoListings.length === 0) {
      map.fitBounds(NYC_BOUNDS, { padding: 40, duration: 700 })
      return
    }

    const only = geoListings[0]
    if (geoListings.length === 1 && only) {
      map.flyTo({
        center: [only.lng, only.lat],
        zoom: 15,
        duration: 700,
      })
      return
    }

    const lngs = geoListings.map((l) => l.lng)
    const lats = geoListings.map((l) => l.lat)
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 64, maxZoom: 15, duration: 700 }
    )
  }, [listings])

  // Re-fit when filtered listings change (only once map is loaded)
  useEffect(() => {
    if (mapRef.current?.loaded()) fitBounds()
  }, [fitBounds])

  // Close popup when filter results change
  useEffect(() => {
    setSelectedId(null)
  }, [geoListings])

  return (
    <Map
      ref={mapRef}
      initialViewState={{ latitude: 40.732, longitude: -73.998, zoom: 11.4 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: "100%", height: "100%" }}
      reuseMaps
      onLoad={fitBounds}
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
            setSelectedId((prev) =>
              prev === listing.id ? null : listing.id
            )
          }}
        >
          <PricePill
            price={listing.price}
            selected={selectedId === listing.id}
          />
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

export default ListingsBrowseMap
