"use client"

import Image from "next/image"
import Link from "next/link"
import type { Listing } from "@/types"
import { useSaved } from "@/contexts/SavedContext"

interface Props {
  listing: Listing
}

export function ListingCard({ listing }: Props) {
  const { isSaved, toggleSaved } = useSaved()
  const liked = isSaved(listing.id)

  const bedLabel = listing.beds === 0 ? "Studio" : `${listing.beds} bd`

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <article className="bg-white border border-gray-200 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
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
            <span className="absolute top-3 left-3 bg-gold text-gray-900 text-[11px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider">
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
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-110"
          >
            <i
              className={`${
                liked ? "fa-solid text-red-500" : "fa-regular text-gray-400"
              } fa-heart text-sm`}
            />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Neighborhood tag */}
          <span className="inline-block text-[11px] font-bold text-white bg-gray-900 px-2.5 py-1 rounded-full mb-3">
            {listing.neighborhood}
          </span>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              ${listing.price.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-400">/mo</span>
          </div>

          {/* Address */}
          <p className="text-sm text-gray-600 font-medium truncate mb-3">
            {listing.title}
          </p>

          {/* Stats as chunky pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {bedLabel}
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {listing.baths} ba
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {listing.sqft.toLocaleString()} sqft
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
