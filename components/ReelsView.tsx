"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Listing } from "@/types"

interface ReelSlideProps {
  listing: Listing
  isActive: boolean
  onVisible: (index: number) => void
  index: number
}

function ReelSlide({ listing, isActive, onVisible, index }: ReelSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [hearted, setHearted] = useState(false)

  useEffect(() => {
    const el = slideRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(index)
          videoRef.current?.play().catch(() => undefined)
        } else {
          videoRef.current?.pause()
        }
      },
      { threshold: 0.6 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [index, onVisible])

  const bedLabel =
    listing.beds === 0
      ? "Studio"
      : listing.beds === 1
        ? "1 bed"
        : `${listing.beds} beds`

  return (
    <div
      ref={slideRef}
      className="snap-start w-full h-full relative overflow-hidden cursor-pointer flex-shrink-0"
      onClick={() => router.push(`/listings/${listing.id}`)}
    >
      {/* Video background */}
      <video
        ref={videoRef}
        src={listing.videoUrl}
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Heart button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setHearted((h) => !h)
        }}
        className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
        aria-label={hearted ? "Remove from favorites" : "Add to favorites"}
      >
        <i
          className={`${hearted ? "fa-solid" : "fa-regular"} fa-heart text-base ${hearted ? "text-red-400" : ""}`}
        />
      </button>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8">
        {/* Neighborhood pill */}
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 text-gray-900 bg-[#c9a96e]">
          {listing.neighborhood}
        </span>

        {/* Price */}
        <p className="text-4xl font-extrabold text-white leading-none mb-1">
          ${listing.price.toLocaleString()}
          <span className="text-lg font-medium text-white/70">/mo</span>
        </p>

        {/* Address */}
        <p className="text-sm text-white/80 mb-3 leading-snug">{listing.address}</p>

        {/* Stats pills */}
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

        {/* CTA */}
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
  const containerRef = useRef<HTMLDivElement>(null)

  const handleVisible = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const scrollToIndex = (index: number) => {
    const container = containerRef.current
    if (!container) return
    const slide = container.children[index] as HTMLElement
    slide?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="relative w-full h-full">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {listings.map((listing, i) => (
          <ReelSlide
            key={listing.id}
            listing={listing}
            isActive={activeIndex === i}
            onVisible={handleVisible}
            index={i}
          />
        ))}
      </div>

      {/* Dot rail */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-10">
        {listings.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
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
