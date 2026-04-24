"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Listing } from "@/types"
import { AppNav } from "./AppNav"
import dynamic from "next/dynamic"

const ListingMap = dynamic(() => import("./ListingMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100" />,
})

type Props = {
  listing: Listing
}

function buildGalleryImages(listing: Listing): string[] {
  const base = listing.imageUrl
  // Extract seed from URL like https://picsum.photos/seed/garfield247/800/600
  const match = /\/seed\/([^/]+)\//.exec(base)
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
    listing.beds === 0 ? "Studio" : listing.beds === 1 ? "1 Bed" : `${listing.beds} Beds`

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <Link
          href="/listings"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900"
        >
          <i className="fa-solid fa-arrow-left text-xs" />
          Back to listings
        </Link>

        {/* ── Photo gallery ────────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-1 gap-3 overflow-hidden rounded-2xl lg:grid-cols-[2fr_1fr]">
          {/* Main image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:h-[480px]">
            <Image
              src={gallery[activeImg] ?? listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover"
              priority
            />
            {/* Heart on main image */}
            <button
              onClick={() => setHearted((h) => !h)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow backdrop-blur-sm transition-colors hover:bg-white"
              aria-label={hearted ? "Remove from favorites" : "Save listing"}
            >
              <i
                className={`${hearted ? "fa-solid text-red-500" : "fa-regular"} fa-heart text-base`}
              />
            </button>
          </div>

          {/* Thumbnails column */}
          <div className="hidden grid-rows-3 gap-3 lg:grid">
            {gallery.slice(1).map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i + 1)}
                className={`relative overflow-hidden rounded-none transition-all ${
                  activeImg === i + 1
                    ? "ring-3 ring-gray-900 ring-offset-2"
                    : "opacity-80 hover:opacity-100"
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
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {gallery.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                activeImg === i ? "ring-2 ring-gray-900" : "opacity-70"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div>
            {/* Info block */}
            <div className="mb-8">
              <span className="mb-3 inline-block rounded-full bg-[#c9a96e] px-3 py-1 text-xs font-bold text-gray-900">
                {listing.neighborhood}
              </span>

              <h1 className="mb-1 text-4xl leading-tight font-extrabold text-gray-900">
                ${listing.price.toLocaleString()}
                {listing.listingType !== "sale" && (
                  <span className="text-xl font-medium text-gray-400">/mo</span>
                )}
              </h1>

              <p className="mb-4 text-gray-500">{listing.address}</p>

              {/* Stats pills */}
              <div className="mb-5 flex flex-wrap gap-2">
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
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700"
                  >
                    <i className={`fa-solid ${icon} text-xs text-gray-400`} />
                    {label}
                  </span>
                ))}
              </div>

              <p className="leading-relaxed text-gray-600">{listing.description}</p>
            </div>

            {/* Amenities */}
            <div className="mb-10">
              <h2 className="mb-4 text-xl font-extrabold text-gray-900">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 capitalize"
                  >
                    <i className="fa-solid fa-check text-xs text-[#c9a96e]" />
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Floor plan placeholder */}
            <div className="mb-10">
              <h2 className="mb-4 text-xl font-extrabold text-gray-900">Floor Plan</h2>
              <div className="flex h-52 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-white text-center">
                <i className="fa-regular fa-map text-4xl text-gray-200" />
                <p className="text-sm font-semibold text-gray-400">Floor plan coming soon</p>
              </div>
            </div>

            {/* Location */}
            <div className="mb-10">
              <h2 className="mb-4 text-xl font-extrabold text-gray-900">Location</h2>
              <div className="h-72 overflow-hidden rounded-2xl">
                <ListingMap lat={listing.lat} lng={listing.lng} />
              </div>
            </div>

            {/* Video tour */}
            {listing.videoUrl && (
              <div className="mb-10">
                <h2 className="mb-4 text-xl font-extrabold text-gray-900">Video Tour</h2>
                <div className="overflow-hidden rounded-2xl">
                  <video
                    src={listing.videoUrl}
                    poster={listing.imageUrl}
                    controls
                    className="aspect-video w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Right column — sticky CTA card ──────────────────────────────── */}
          <div>
            <div className="sticky top-[calc(4rem+1.5rem)] rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="mb-1 text-2xl font-extrabold text-gray-900">
                ${listing.price.toLocaleString()}
                {listing.listingType !== "sale" && (
                  <span className="text-base font-medium text-gray-400">/mo</span>
                )}
              </p>
              <p className="mb-6 text-sm text-gray-500">
                {bedLabel} · {listing.neighborhood}
              </p>

              <button className="mb-3 w-full rounded-full bg-gray-900 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-700">
                Request a tour
              </button>
              <button className="w-full rounded-full border border-gray-200 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50">
                Contact landlord
              </button>

              <p className="mt-4 text-center text-xs text-gray-400">
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
