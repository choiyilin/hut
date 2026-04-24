import type { Listing } from "@/types"
import { realtorRowToListing, type RealtorListingRow } from "@/types"
import listingsData from "@/data/listings.json"
import { ListingsClient } from "@/components/ListingsClient"
import { mapboxToken } from "@/env/server"
import { createClient } from "@/lib/supabase/server"

// In Next.js 16, searchParams is a Promise
type Props = {
  searchParams: Promise<{ q?: string; type?: string; _r?: string }>
}

async function geocodeMissing(listings: Listing[]): Promise<Listing[]> {
  if (!mapboxToken) return listings

  return Promise.all(
    listings.map(async (listing) => {
      if (listing.lat !== 0 || listing.lng !== 0) return listing
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(listing.address)}.json`,
        )
        url.searchParams.set("access_token", mapboxToken)
        url.searchParams.set("country", "US")
        url.searchParams.set("proximity", "-73.998,40.732")
        url.searchParams.set("types", "address")
        url.searchParams.set("limit", "1")
        const res = await fetch(url.toString())
        const data = await res.json()
        const center = data.features?.[0]?.center
        if (center) return { ...listing, lng: center[0], lat: center[1] }
      } catch {}
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
