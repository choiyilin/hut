"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox"
import type { MapMouseEvent as MapLayerMouseEvent } from "react-map-gl/mapbox"
import type { FeatureCollection } from "geojson"
import "mapbox-gl/dist/mapbox-gl.css"

// NYC Neighborhood Tabulation Areas 2020 — NYC Open Data (ntatype=0 → residential only)
const NTA_GEOJSON_URL =
  "https://data.cityofnewyork.us/resource/9nt8-h7nd.geojson?ntatype=0"

interface Props {
  selected: string[]
  onToggle: (neighborhood: string) => void
  allCuratedNames: string[]
}

/** Map an NTA polygon name to the best matching curated neighborhood name. */
function resolveNTA(ntaname: string, curated: string[]): string {
  const nl = ntaname.toLowerCase()
  const byContains = curated
    .filter((n) => nl.includes(n.toLowerCase()))
    .sort((a, b) => b.length - a.length)
  if (byContains[0]) return byContains[0]
  const byReverse = curated.filter((n) => n.toLowerCase().includes(nl))
  if (byReverse[0]) return byReverse[0]
  return ntaname
}

export default function NeighborhoodMap({ selected, onToggle, allCuratedNames }: Props) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [hoveredNTA, setHoveredNTA] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(NTA_GEOJSON_URL)
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed")
        return r.json()
      })
      .then((data) => setGeojson(data as FeatureCollection))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  /** NTA polygon names that correspond to any currently selected curated name */
  const selectedNTANames = useMemo<string[]>(() => {
    if (!geojson) return []
    return geojson.features
      .map((f) => f.properties?.ntaname as string | undefined)
      .filter((n): n is string => !!n)
      .filter((ntaname) =>
        selected.some((s) => {
          const sl = s.toLowerCase()
          const nl = ntaname.toLowerCase()
          return nl.includes(sl) || sl.includes(nl)
        })
      )
  }, [geojson, selected])

  const fillLayer = useMemo(
    () => ({
      id: "nta-fill",
      type: "fill" as const,
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "ntaname"], hoveredNTA ?? "__none__"],
          "rgba(59,130,246,0.25)",
          ["in", ["get", "ntaname"], ["literal", selectedNTANames]],
          "rgba(59,130,246,0.45)",
          "rgba(0,0,0,0.02)",
        ],
        "fill-opacity": 1,
      },
    }),
    [hoveredNTA, selectedNTANames]
  )

  const lineLayer = useMemo(
    () => ({
      id: "nta-line",
      type: "line" as const,
      paint: {
        "line-color": [
          "case",
          ["in", ["get", "ntaname"], ["literal", selectedNTANames]],
          "#2563eb",
          "#d1d5db",
        ],
        "line-width": [
          "case",
          ["in", ["get", "ntaname"], ["literal", selectedNTANames]],
          2,
          0.5,
        ],
      },
    }),
    [selectedNTANames]
  )

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    setHoveredNTA(e.features?.[0]?.properties?.ntaname ?? null)
  }, [])

  const handleMouseLeave = useCallback(() => setHoveredNTA(null), [])

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const ntaname = e.features?.[0]?.properties?.ntaname as string | undefined
      if (!ntaname) return
      onToggle(resolveNTA(ntaname, allCuratedNames))
    },
    [allCuratedNames, onToggle]
  )

  const hoveredLabel = hoveredNTA ? resolveNTA(hoveredNTA, allCuratedNames) : null

  return (
    <div className="relative w-full h-full bg-gray-100">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Loading map…</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-400">Map unavailable</p>
        </div>
      )}
      <Map
        initialViewState={{ latitude: 40.732, longitude: -73.998, zoom: 11.4 }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={["nta-fill"]}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        cursor={hoveredNTA ? "pointer" : "default"}
      >
        <NavigationControl position="top-left" />
        {geojson && (
          <Source id="nta" type="geojson" data={geojson}>
            {/* @ts-expect-error – dynamic expression arrays are valid Mapbox GL values */}
            <Layer {...fillLayer} />
            {/* @ts-expect-error */}
            <Layer {...lineLayer} />
          </Source>
        )}
      </Map>

      {hoveredLabel && (
        <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-semibold rounded-full pointer-events-none backdrop-blur-sm">
          {hoveredLabel}
        </div>
      )}
    </div>
  )
}
