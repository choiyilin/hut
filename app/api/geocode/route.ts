import { mapboxToken } from "@/env/server"

export async function POST(req: Request) {
  const { address } = await req.json()

  if (!mapboxToken || !address?.trim()) {
    return Response.json({ error: "bad request" }, { status: 400 })
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`
  )
  url.searchParams.set("access_token", mapboxToken)
  url.searchParams.set("country", "US")
  url.searchParams.set("proximity", "-73.998,40.732")
  url.searchParams.set("types", "address")
  url.searchParams.set("limit", "1")

  const res = await fetch(url.toString())
  if (!res.ok) {
    return Response.json({ error: "geocoding failed" }, { status: 502 })
  }

  const data = await res.json()
  const center = data.features?.[0]?.center
  if (!center) {
    return Response.json({ lat: 0, lng: 0 })
  }

  const [lng, lat] = center
  return Response.json({ lat, lng })
}
