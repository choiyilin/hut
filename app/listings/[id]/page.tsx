import { notFound } from "next/navigation"
import listingsData from "@/data/listings.json"
import type { Listing } from "@/types"
import { ListingDetail } from "@/components/ListingDetail"

const listings = listingsData as Listing[]

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }))
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const listing = listings.find((l) => l.id === id)
  if (!listing) notFound()
  return <ListingDetail listing={listing} />
}
