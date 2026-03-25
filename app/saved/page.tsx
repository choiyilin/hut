"use client"

import Link from "next/link"
import { AppNav } from "@/components/AppNav"
import { ListingCard } from "@/components/ListingCard"
import { useSaved } from "@/contexts/SavedContext"
import listingsData from "@/data/listings.json"
import type { Listing } from "@/types"

const allListings = listingsData as Listing[]

export default function SavedPage() {
  const { savedIds } = useSaved()
  const savedListings = allListings.filter((l) => savedIds.has(l.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight leading-none mb-1">
            Saved
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {savedListings.length === 0
              ? "No saved listings yet"
              : `${savedListings.length} saved ${savedListings.length === 1 ? "listing" : "listings"}`}
          </p>
        </div>

        {savedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-5">
              <i className="fa-regular fa-heart text-gray-300 text-2xl" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Nothing saved yet</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-sm leading-relaxed">
              Heart any listing while browsing and it&apos;ll appear here.
            </p>
            <Link
              href="/listings"
              className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {savedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
