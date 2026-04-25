import { geocode, type GeocodeResult } from "@/lib/mapbox/geocode"
import { createClient } from "@/lib/supabase/server"

type BackfillRow = {
  id: string
  address: string
  unit_number: string | null
  city: string | null
  state: string | null
  zip: string | null
}

type BackfillResult = {
  id: string
  geocoded: string
  lat: number
  lng: number
  outcome: GeocodeResult["kind"] | "db-error"
}

/**
 * Strip unit number and trailing ", City, State Zip" baked into the address
 * column, then re-compose using explicit city/state/zip fields. Same logic as
 * before — promoted out of the route handler so it's testable in isolation.
 */
function composeGeocodeAddress(row: BackfillRow): string {
  let street = row.address
  if (row.unit_number) {
    street = street.replace(`, Apt ${row.unit_number}`, "").replace(`, ${row.unit_number}`, "")
  }
  const tail = [row.city, `${row.state ?? ""} ${row.zip ?? ""}`.trim()].filter(Boolean).join(", ")
  if (tail && street.endsWith(`, ${tail}`)) {
    street = street.slice(0, street.length - tail.length - 2)
  }
  return [street, row.city, row.state, row.zip].filter(Boolean).join(", ")
}

export async function POST(): Promise<Response> {
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

  const results: BackfillResult[] = []

  for (const row of rows as BackfillRow[]) {
    const address = composeGeocodeAddress(row)
    // bypassCache so the backfill always re-resolves against current data,
    // even if a previous request cached a not-found.
    const result = await geocode(address, { bypassCache: true })

    if (result.kind === "found") {
      const { error: updateErr } = await supabase
        .from("realtor_listings")
        .update({ lat: result.coords.lat, lng: result.coords.lng })
        .eq("id", row.id)
      results.push({
        id: row.id,
        geocoded: address,
        lat: result.coords.lat,
        lng: result.coords.lng,
        outcome: updateErr ? "db-error" : "found",
      })
    } else {
      results.push({ id: row.id, geocoded: address, lat: 0, lng: 0, outcome: result.kind })
    }

    // Stop early if we're rate-limited — let the caller retry later.
    if (result.kind === "rate-limited") break
  }

  const updated = results.filter((r) => r.outcome === "found").length
  return Response.json({ updated, total: rows.length, results })
}
