import type { Listing } from "@/types"
import { realtorRowToListing, type RealtorListingRow } from "@/types"
import listingsData from "@/data/listings.json"
import { ListingsClient } from "@/components/ListingsClient"
import { createClient } from "@/lib/supabase/server"

// In Next.js 16, searchParams is a Promise
interface Props {
  searchParams: Promise<{ q?: string; type?: string; _r?: string }>
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

  const allListings: Listing[] = [
    ...(listingsData as Listing[]),
    ...realtorRows.map((r) => realtorRowToListing(r)),
  ]

  return (
    <ListingsClient
      key={_r ?? listingType}
      initialListings={allListings}
      initialQuery={q ?? ""}
      initialListingType={listingType}
    />
  )
}
