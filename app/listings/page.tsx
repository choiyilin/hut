import type { Listing } from "@/types"
import { realtorRowToListing, type RealtorListingRow } from "@/types"
import listingsData from "@/data/listings.json"
import { ListingsClient } from "@/components/ListingsClient"
import { geocode } from "@/lib/mapbox/geocode"
import { createClient } from "@/lib/supabase/server"

// In Next.js 16, searchParams is a Promise
type Props = {
  searchParams: Promise<{ q?: string; type?: string; _r?: string }>
}

async function geocodeMissing(listings: Listing[]): Promise<Listing[]> {
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

export default async function ListingsPage({ searchParams }: Props) {
  const { q, type, _r } = await searchParams
  const listingType: "rent" | "sale" = type === "sale" ? "sale" : "rent"

  let realtorRows: RealtorListingRow[] = []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("realtor_listings")
      .select("*")
      .in("status", ["active", "pending"])
      .order("date_posted", { ascending: false })
      .abortSignal(AbortSignal.timeout(5000))
    realtorRows = (data ?? []) as RealtorListingRow[]
  } catch {
    // Supabase unreachable — show static listings only
  }

  const merged: Listing[] = [
    ...(listingsData as Listing[]),
    ...realtorRows.map((r) => realtorRowToListing(r)),
  ]

  const allListings = await geocodeMissing(merged)

  return (
    <ListingsClient
      key={_r ?? listingType}
      initialListings={allListings}
      initialQuery={q ?? ""}
      initialListingType={listingType}
    />
  )
}
