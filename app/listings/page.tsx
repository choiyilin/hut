import type { Listing } from "@/schemas/listing"
import listingsData from "@/data/listings.json"
import { ListingsClient } from "@/components/ListingsClient"
import { geocode } from "@/lib/mapbox/geocode"
import { createClient } from "@/lib/supabase/server"
import { selectPublicListings } from "@/lib/supabase/queries/listings"

async function geocodeMissing(listings: readonly Listing[]): Promise<Listing[]> {
  return Promise.all(
    listings.map(async (listing) => {
      if (listing.lat !== 0 || listing.lng !== 0) return listing
      const result = await geocode(listing.address)
      if (result.kind === "found") {
        return { ...listing, lat: result.coords.lat, lng: result.coords.lng }
      }
      // not-found / rate-limited / timeout / upstream-error / config-error:
      // leave the listing's existing 0,0 so the map filter excludes it.
      // Phase 7 dashboard surfaces these so realtors see why their pin is missing.
      return listing
    }),
  )
}

export default async function ListingsPage() {
  const supabase = await createClient()
  const result = await selectPublicListings(supabase)

  // Phase 2: any non-ok kind (db-error, validation-error, timeout) silently
  // falls back to the static catalog so the page still renders. Phase 4
  // surfaces these via a server-component error boundary so the user sees
  // a "fresh listings unavailable, try again" toast instead of nothing.
  const realtorListings = result.kind === "ok" ? result.listings : []

  const merged: Listing[] = [...(listingsData as Listing[]), ...realtorListings]
  const allListings = await geocodeMissing(merged)

  return <ListingsClient initialListings={allListings} />
}
