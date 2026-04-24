"use client"

import { useRef, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Listing } from "@/types"
import { useSaved } from "@/contexts/SavedContext"


function ReelSlide({ listing, index }: { listing: Listing; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { isSaved, toggleSaved } = useSaved()
  const [preload, setPreload] = useState<"none" | "metadata" | "auto">(
    index === 0 ? "auto" : "none"
  )

  useEffect(() => {
    const video = videoRef.current
    const slide = slideRef.current
    if (!video || !slide) return

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setPreload((current) => (current === "auto" ? current : "metadata"))
        }
      },
      { threshold: 0, rootMargin: "100% 0px" }
    )

    const playObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.6 }
    )

    preloadObserver.observe(slide)
    playObserver.observe(slide)
    return () => {
      preloadObserver.disconnect()
      playObserver.disconnect()
    }
  }, [])

  const bedLabel =
    listing.beds === 0 ? "Studio" : listing.beds === 1 ? "1 bed" : `${listing.beds} beds`

  const tags = [
    bedLabel,
    listing.baths === 1 ? "1 bath" : `${listing.baths} baths`,
    `${listing.sqft.toLocaleString()} sqft`,
  ]

  return (
    <div
      ref={slideRef}
      style={{
        width: "100%",
        height: "100%",
        scrollSnapAlign: "start",
        flexShrink: 0,
        position: "relative",
        background: "#000",
      }}
    >
      {/* Video — fills the full snap unit */}
      <video
        ref={videoRef}
        src={listing.videoUrl}
        preload={preload}
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Vignette — heavier at bottom so text reads over video */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Info overlay — bottom-left, leaves room for action column on the right */}
      <div
        onClick={() => router.push(`/listings/${listing.id}`)}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 76,
          padding: "0 16px 20px 16px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <span
          style={{
            alignSelf: "flex-start",
            padding: "2px 9px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            color: "#111",
            background: "#c9a96e",
          }}
        >
          {listing.neighborhood}
        </span>

        <p style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
          ${listing.price.toLocaleString()}
          {listing.listingType !== "sale" && (
            <span
              style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.6)", marginLeft: 3 }}
            >
              /mo
            </span>
          )}
        </p>

        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {listing.address}
        </p>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(6px)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right action column — pinned to bottom-right of the slide */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 14,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleSaved(listing.id)
          }}
          aria-label={isSaved(listing.id) ? "Remove from saved" : "Save listing"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: isSaved(listing.id) ? "#ff4d6d" : "#fff",
            padding: 0,
          }}
        >
          <i
            className={`${isSaved(listing.id) ? "fa-solid" : "fa-regular"} fa-heart`}
            style={{ fontSize: 30 }}
          />
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Save</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            const url = `${window.location.origin}/listings/${listing.id}`
            if (navigator.share) {
              navigator.share({ title: listing.title, text: listing.address, url }).catch(() => undefined)
            } else {
              navigator.clipboard.writeText(url).catch(() => undefined)
            }
          }}
          aria-label="Share listing"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            padding: 0,
          }}
        >
          <i className="fa-solid fa-share" style={{ fontSize: 28 }} />
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>Share</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/listings/${listing.id}`)
          }}
          aria-label="View full listing"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#fff",
            padding: 0,
          }}
        >
          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 24 }} />
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>View</span>
        </button>
      </div>
    </div>
  )
}

export function ReelsView({ listings }: { listings: Listing[] }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        width: "100%",
        height: "100%",
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* padding-bottom = info panel height so the last item can scroll fully into view */}
      <div
        className="reel-feed-column"
        style={{
          height: "100%",
          aspectRatio: "9 / 16",
          maxWidth: "100%",
          overflowY: "scroll",
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        } as React.CSSProperties}
      >
        {listings.map((listing, index) => (
          <ReelSlide key={listing.id} listing={listing} index={index} />
        ))}
      </div>
    </div>
  )
}
