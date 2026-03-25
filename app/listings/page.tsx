import type { Listing } from "@/types"
import listingsData from "@/data/listings.json"
import { ListingsClient } from "@/components/ListingsClient"

// In Next.js 16, searchParams is a Promise
interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function ListingsPage({ searchParams }: Props) {
  const { q } = await searchParams

  return (
    <ListingsClient
      initialListings={listingsData as Listing[]}
      initialQuery={q ?? ""}
    />
  )
}
