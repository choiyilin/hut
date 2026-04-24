"use client"

import Image from "next/image"
import Link from "next/link"
import type { Listing } from "@/types"
import { useSaved } from "@/contexts/SavedContext"

type Props = {
  listing: Listing
}

export function ListingCard({ listing }: Props) {
  const { isSaved, toggleSaved } = useSaved()
  const liked = isSaved(listing.id)

  const bedLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bd`

  return (
    <Link href={`/listings/${listing.id}`} className="group block h-full">
      <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {listing.featured && (
            <span className="bg-gold absolute top-3 left-3 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-wider text-gray-900 uppercase">
              ★ Featured
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleSaved(listing.id)
            }}
            aria-label={liked ? "Remove from saved" : "Save listing"}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-110"
          >
            <i
              className={`${
                liked ? "fa-solid text-red-500" : "fa-regular text-gray-400"
              } fa-heart text-sm`}
            />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-4">
          {/* Neighborhood tag */}
          <span className="mb-3 inline-block rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-bold text-white">
            {listing.neighborhood}
          </span>

          {/* Price */}
          <div className="mb-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              ${listing.price.toLocaleString()}
            </span>
            {listing.listingType !== "sale" && (
              <span className="text-sm font-medium text-gray-400">/mo</span>
            )}
          </div>

          {/* Address */}
          <p className="mb-3 truncate text-sm font-medium text-gray-600">{listing.title}</p>

          {/* Stats as chunky pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-800">
              {bedLabel}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-800">
              {listing.baths} ba
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-800">
              {listing.sqft.toLocaleString()} sqft
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
