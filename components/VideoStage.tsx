"use client"

import { useEffect, useRef } from "react"

const VIDEOS = [
  "/videos/bg-1.mp4",
  "/videos/bg-2.mp4",
  "/videos/bg-3.mp4",
]

export function VideoStage() {
  const vidARef = useRef<HTMLVideoElement>(null)
  const vidBRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const vidA = vidARef.current
    const vidB = vidBRef.current
    if (!vidA || !vidB) return

    let idx = 0
    let active = vidA
    let standby = vidB

    function attachEndListener() {
      active.addEventListener("ended", onVideoEnd, { once: true })
    }

    function onVideoEnd() {
      idx = (idx + 1) % VIDEOS.length
      const preloadIdx = (idx + 1) % VIDEOS.length

      standby.style.zIndex = "2"
      active.style.zIndex = "1"

      standby.play().catch(() => {})
      standby.style.opacity = "1"
      active.style.opacity = "0"

      setTimeout(() => {
        ;[active, standby] = [standby, active]
        standby.src = VIDEOS[preloadIdx]
        standby.load()
        attachEndListener()
      }, 1150)
    }

    // Boot
    active.src = VIDEOS[idx]
    active.load()
    active.play().catch(() => {})
    standby.src = VIDEOS[(idx + 1) % VIDEOS.length]
    standby.load()
    attachEndListener()
  }, [])

  return (
    <div className="fixed inset-0 z-0">
      <video
        ref={vidARef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: 1, zIndex: 1 }}
      />
      <video
        ref={vidBRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
        style={{ opacity: 0, zIndex: 2 }}
      />
    </div>
  )
}
