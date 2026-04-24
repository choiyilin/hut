import listingsData from "@/data/listings.json"
import { SavedClient } from "@/components/SavedClient"
import { createClient } from "@/lib/supabase/server"
import { realtorRowToListing, type Listing, type RealtorListingRow } from "@/types"

export default async function SavedPage() {
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
    // Supabase unreachable — fall back to static listings only
  }

  const allListings: Listing[] = [
    ...(listingsData as Listing[]),
    ...realtorRows.map((r) => realtorRowToListing(r)),
  ]

  return <SavedClient allListings={allListings} />
}
