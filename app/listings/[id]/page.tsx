import { notFound } from "next/navigation"
import listingsData from "@/data/listings.json"
import type { Listing } from "@/types"
import { realtorRowToListing, type RealtorListingRow } from "@/types"
import { ListingDetail } from "@/components/ListingDetail"
import { createClient } from "@/lib/supabase/server"

type Props = {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params

  // Check static listings first
  const staticListing = (listingsData as Listing[]).find((l) => l.id === id)
  if (staticListing) return <ListingDetail listing={staticListing} />

  // Fall back to Supabase for realtor listings
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("realtor_listings")
      .select("*")
      .eq("id", id)
      .in("status", ["active", "pending", "draft"])
      .single()

    if (data) return <ListingDetail listing={realtorRowToListing(data as RealtorListingRow)} />
  } catch {
    // Supabase unreachable
  }

  notFound()
}
