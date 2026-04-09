"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Listing } from "@/types"

interface ReelSlideProps {
  listing: Listing
  isActive: boolean
}

function ReelSlide({ listing, isActive }: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  const [hearted, setHearted] = useState(false)

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => undefined)
    } else {
      videoRef.current?.pause()
    }
  }, [isActive])

  const bedLabel =
    listing.beds === 0
      ? "Studio"
      : listing.beds === 1
        ? "1 bed"
        : `${listing.beds} beds`

  return (
    <div
      className={`absolute inset-0 overflow-hidden cursor-pointer transition-opacity duration-300 ${
        isActive ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => router.push(`/listings/${listing.id}`)}
    >
      <video
        ref={videoRef}
        src={listing.videoUrl}
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Heart */}
      <button
        onClick={(e) => { e.stopPropagation(); setHearted(h => !h) }}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
        aria-label={hearted ? "Remove from favorites" : "Add to favorites"}
      >
        <i className={`${hearted ? "fa-solid" : "fa-regular"} fa-heart text-base ${hearted ? "text-red-400" : ""}`} />
      </button>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 text-gray-900 bg-[#c9a96e]">
          {listing.neighborhood}
        </span>
        <p className="text-4xl font-extrabold text-white leading-none mb-1">
          ${listing.price.toLocaleString()}
          <span className="text-lg font-medium text-white/70">/mo</span>
        </p>
        <p className="text-sm text-white/80 mb-3 leading-snug">{listing.address}</p>
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm">
            {bedLabel}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm">
            {listing.baths === 1 ? "1 bath" : `${listing.baths} baths`}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm">
            {listing.sqft.toLocaleString()} sqft
          </span>
        </div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-gray-900 text-sm font-bold hover:bg-gray-100 transition-colors">
          View listing
          <i className="fa-solid fa-arrow-right text-xs" />
        </div>
      </div>
    </div>
  )
}

interface Props {
  listings: Listing[]
}

export function ReelsView({ listings }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeIndexRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef(0)

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= listings.length) return
    activeIndexRef.current = index
    setActiveIndex(index)
  }, [listings.length])

  // Trackpad / mouse wheel navigation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastScrollRef.current < 700) return
      if (Math.abs(e.deltaY) < 10) return
      lastScrollRef.current = now
      if (e.deltaY > 0) goTo(activeIndexRef.current + 1)
      else goTo(activeIndexRef.current - 1)
    }

    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [goTo])

  return (
    <div
      ref={containerRef}
      className="relative h-full bg-gray-950 flex flex-col items-center justify-center gap-3 overflow-hidden"
    >
      {/* Up arrow — fixed-height slot so layout doesn't shift */}
      <div className="h-10 flex items-center">
        {activeIndex > 0 && (
          <button
            onClick={() => goTo(activeIndex - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            aria-label="Previous listing"
          >
            <i className="fa-solid fa-chevron-up text-sm" />
          </button>
        )}
      </div>

      {/* Reel card — 9:16 portrait, ~56vh tall */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ height: "56vh", width: "calc(56vh * 9 / 16)" }}
      >
        {listings.map((listing, i) => (
          <ReelSlide
            key={listing.id}
            listing={listing}
            isActive={activeIndex === i}
          />
        ))}
      </div>

      {/* Down arrow */}
      <div className="h-10 flex items-center">
        {activeIndex < listings.length - 1 && (
          <button
            onClick={() => goTo(activeIndex + 1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors"
            aria-label="Next listing"
          >
            <i className="fa-solid fa-chevron-down text-sm" />
          </button>
        )}
      </div>

      {/* Dot rail */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10">
        {listings.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full bg-white transition-all duration-200 ${
              activeIndex === i
                ? "w-1.5 h-6 opacity-100"
                : "w-1.5 h-1.5 opacity-40 hover:opacity-70"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
