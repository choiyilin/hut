"use client"

import Map, { Marker } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

import { clientEnv } from "@/env/client"

type Props = {
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
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 shadow-lg">
          <i className="fa-solid fa-location-dot text-lg text-[#c9a96e]" />
        </div>
      </Marker>
    </Map>
  )
}

export default ListingMap
