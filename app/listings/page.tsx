import type { Listing } from "@/types"
import { realtorRowToListing, type RealtorListingRow } from "@/types"
import listingsData from "@/data/listings.json"
import { ListingsClient } from "@/components/ListingsClient"
import { createClient } from "@/lib/supabase/server"

// In Next.js 16, searchParams is a Promise
interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ListingsPage({ searchParams }: Props) {
  const { q } = await searchParams

  const supabase = await createClient()
  const { data: realtorRows } = await supabase
    .from("realtor_listings")
    .select("*")
    .order("date_posted", { ascending: false })

  const allListings: Listing[] = [
    ...(listingsData as Listing[]),
    ...(realtorRows ?? []).map((r) => realtorRowToListing(r as RealtorListingRow)),
  ]

  return (
    <ListingsClient
      initialListings={allListings}
      initialQuery={q ?? ""}
    />
  )
}
