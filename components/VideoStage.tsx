"use client"

import { useEffect, useRef } from "react"

const VIDEOS = ["/videos/bg-1.mp4", "/videos/bg-2.mp4", "/videos/bg-3.mp4"] as const

function videoAt(i: number): string {
  return VIDEOS[i % VIDEOS.length] ?? VIDEOS[0]
}

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
        standby.src = videoAt(preloadIdx)
        standby.load()
        attachEndListener()
      }, 1150)
    }

    // Boot — only fetch the first video; preload standby only after it's playing
    active.play().catch(() => {})
    active.addEventListener(
      "playing",
      () => {
        standby.src = videoAt(idx + 1)
        standby.load()
      },
      { once: true },
    )
    attachEndListener()
  }, [])

  return (
    <div className="fixed inset-0 z-0">
      <video
        ref={vidARef}
        src={VIDEOS[0]}
        autoPlay
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        style={{ opacity: 1, zIndex: 1 }}
      />
      <video
        ref={vidBRef}
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
        style={{ opacity: 0, zIndex: 2 }}
      />
    </div>
  )
}
