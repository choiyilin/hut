"use client"

import Map, { Marker } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

import { clientEnv } from "@/env/client"

interface Props {
  lat: number
  lng: number
}

export function ListingMap({ lat, lng }: Props) {
  return (
    <Map
      initialViewState={{ longitude: lng, latitude: lat, zoom: 14 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN}
      style={{ width: "100%", height: "100%" }}
    >
      <Marker longitude={lng} latitude={lat} anchor="bottom">
        <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center shadow-lg">
          <i className="fa-solid fa-location-dot text-[#c9a96e] text-lg" />
        </div>
      </Marker>
    </Map>
  )
}

export default ListingMap
