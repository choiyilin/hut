"use client"

import Link from "next/link"
import { AppNav } from "@/components/AppNav"
import { ListingCard } from "@/components/ListingCard"
import { useSaved } from "@/features/saved"
import type { Listing } from "@/types"

type Props = {
  allListings: Listing[]
}

export function SavedClient({ allListings }: Props) {
  const { savedIds } = useSaved()
  const savedListings = allListings.filter((l) => savedIds.has(l.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="mb-1 text-5xl leading-none font-extrabold tracking-tight text-gray-900">
            Saved
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {savedListings.length === 0
              ? "No saved listings yet"
              : `${savedListings.length} saved ${savedListings.length === 1 ? "listing" : "listings"}`}
          </p>
        </div>

        {savedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <i className="fa-regular fa-heart text-2xl text-gray-300" />
            </div>
            <h2 className="mb-2 text-2xl font-extrabold text-gray-900">Nothing saved yet</h2>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-gray-400">
              Heart any listing while browsing and it&apos;ll appear here.
            </p>
            <Link
              href="/listings"
              className="rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-700"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {savedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
