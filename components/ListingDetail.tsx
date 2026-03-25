"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Listing } from "@/types"
import { AppNav } from "./AppNav"
import { ListingMap } from "./ListingMap"

interface Props {
  listing: Listing
}

function buildGalleryImages(listing: Listing): string[] {
  const base = listing.imageUrl
  // Extract seed from URL like https://picsum.photos/seed/garfield247/800/600
  const match = base.match(/\/seed\/([^/]+)\//)
  if (!match) return [base, base, base, base]
  const seed = match[1]
  return [
    base,
    `https://picsum.photos/seed/${seed}-2/800/600`,
    `https://picsum.photos/seed/${seed}-3/800/600`,
    `https://picsum.photos/seed/${seed}-4/800/600`,
  ]
}

export function ListingDetail({ listing }: Props) {
  const [activeImg, setActiveImg] = useState(0)
  const [hearted, setHearted] = useState(false)

  const gallery = buildGalleryImages(listing)

  const bedLabel =
    listing.beds === 0
      ? "Studio"
      : listing.beds === 1
        ? "1 Bed"
        : `${listing.beds} Beds`

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        {/* Back link */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Back to listings
        </Link>

        {/* ── Photo gallery ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3 mb-8 rounded-2xl overflow-hidden">
          {/* Main image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[480px]">
            <Image
              src={gallery[activeImg]}
              alt={listing.title}
              fill
              className="object-cover"
              priority
            />
            {/* Heart on main image */}
            <button
              onClick={() => setHearted((h) => !h)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors shadow"
              aria-label={hearted ? "Remove from favorites" : "Save listing"}
            >
              <i
                className={`${hearted ? "fa-solid text-red-500" : "fa-regular"} fa-heart text-base`}
              />
            </button>
          </div>

          {/* Thumbnails column */}
          <div className="hidden lg:grid grid-rows-3 gap-3">
            {gallery.slice(1).map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i + 1)}
                className={`relative overflow-hidden rounded-none transition-all ${
                  activeImg === i + 1 ? "ring-3 ring-gray-900 ring-offset-2" : "opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt={`${listing.title} photo ${i + 2}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile thumbnail strip */}
        <div className="flex gap-2 mb-8 lg:hidden overflow-x-auto pb-1">
          {gallery.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all ${
                activeImg === i ? "ring-2 ring-gray-900" : "opacity-70"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div>
            {/* Info block */}
            <div className="mb-8">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-gray-900 bg-[#c9a96e] mb-3">
                {listing.neighborhood}
              </span>

              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight mb-1">
                ${listing.price.toLocaleString()}
                <span className="text-xl font-medium text-gray-400">/mo</span>
              </h1>

              <p className="text-gray-500 mb-4">{listing.address}</p>

              {/* Stats pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: "fa-bed", label: bedLabel },
                  {
                    icon: "fa-bath",
                    label: listing.baths === 1 ? "1 Bath" : `${listing.baths} Baths`,
                  },
                  {
                    icon: "fa-vector-square",
                    label: `${listing.sqft.toLocaleString()} sqft`,
                  },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-sm font-semibold text-gray-700"
                  >
                    <i className={`fa-solid ${icon} text-xs text-gray-400`} />
                    {label}
                  </span>
                ))}
              </div>

              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-10">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 capitalize"
                  >
                    <i className="fa-solid fa-check text-[#c9a96e] text-xs" />
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Floor plan placeholder */}
            <div className="mb-10">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Floor Plan</h2>
              <div className="flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center">
                <i className="fa-regular fa-map text-gray-200 text-4xl" />
                <p className="text-sm font-semibold text-gray-400">
                  Floor plan coming soon
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="mb-10">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">Location</h2>
              <div className="rounded-2xl overflow-hidden h-72">
                <ListingMap lat={listing.lat} lng={listing.lng} />
              </div>
            </div>

            {/* Video tour */}
            {listing.videoUrl && (
              <div className="mb-10">
                <h2 className="text-xl font-extrabold text-gray-900 mb-4">Video Tour</h2>
                <div className="rounded-2xl overflow-hidden">
                  <video
                    src={listing.videoUrl}
                    poster={listing.imageUrl}
                    controls
                    className="w-full aspect-video object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Right column — sticky CTA card ──────────────────────────────── */}
          <div>
            <div className="sticky top-[calc(4rem+1.5rem)] bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <p className="text-2xl font-extrabold text-gray-900 mb-1">
                ${listing.price.toLocaleString()}
                <span className="text-base font-medium text-gray-400">/mo</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {bedLabel} · {listing.neighborhood}
              </p>

              <button className="w-full py-3 bg-gray-900 text-white text-sm font-bold rounded-full hover:bg-gray-700 transition-colors mb-3">
                Request a tour
              </button>
              <button className="w-full py-3 border border-gray-200 text-gray-700 text-sm font-bold rounded-full hover:bg-gray-50 transition-colors">
                Contact landlord
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Listed{" "}
                {new Date(listing.datePosted).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
