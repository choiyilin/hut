import { mapboxToken } from "@/env/server"
import { createClient } from "@/lib/supabase/server"

async function geocode(address: string, token: string): Promise<[number, number] | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`
  )
  url.searchParams.set("access_token", token)
  url.searchParams.set("country", "US")
  url.searchParams.set("proximity", "-73.998,40.732")
  url.searchParams.set("limit", "1")

  const res = await fetch(url.toString())
  const data = await res.json()
  const center = data.features?.[0]?.center
  return center ? [center[0], center[1]] : null
}

export async function POST() {
  if (!mapboxToken) {
    return Response.json({ error: "Missing Mapbox token in .env.local" }, { status: 500 })
  }

  const supabase = await createClient()

  const { data: rows, error: fetchErr } = await supabase
    .from("realtor_listings")
    .select("id, address, unit_number, city, state, zip")
    .eq("lat", 0)
    .eq("lng", 0)

  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 500 })
  if (!rows || rows.length === 0) {
    return Response.json({ updated: 0, message: "No zero-coord listings found." })
  }

  const results: { id: string; geocoded: string; lat: number; lng: number; ok: boolean }[] = []

  for (const row of rows) {
    // Strip unit number from address, then append city/state/zip separately
    let street = row.address as string
    if (row.unit_number) {
      street = street.replace(`, Apt ${row.unit_number}`, "").replace(`, ${row.unit_number}`, "")
    }
    // Strip trailing ", City, State Zip" that was baked into address column
    const tail = [row.city, `${row.state ?? ""} ${row.zip ?? ""}`.trim()]
      .filter(Boolean)
      .join(", ")
    if (tail && street.endsWith(`, ${tail}`)) {
      street = street.slice(0, street.length - tail.length - 2)
    }

    const geocodeStr = [street, row.city, row.state, row.zip].filter(Boolean).join(", ")

    try {
      const center = await geocode(geocodeStr, mapboxToken)

      if (!center) {
        results.push({ id: row.id, geocoded: geocodeStr, lat: 0, lng: 0, ok: false })
        continue
      }

      const [lng, lat] = center
      const { error: updateErr } = await supabase
        .from("realtor_listings")
        .update({ lat, lng })
        .eq("id", row.id)

      results.push({ id: row.id, geocoded: geocodeStr, lat, lng, ok: !updateErr })
    } catch {
      results.push({ id: row.id, geocoded: geocodeStr, lat: 0, lng: 0, ok: false })
    }
  }

  const updated = results.filter((r) => r.ok).length
  return Response.json({ updated, total: rows.length, results })
}
