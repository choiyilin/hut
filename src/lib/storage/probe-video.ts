"use client"

import { classifyAspect, type AspectClassification } from "./aspect"

export type VideoProbe = {
  readonly width: number
  readonly height: number
  readonly durationSec: number
  readonly aspect: AspectClassification
}

export type VideoProbeError = { readonly kind: "load-error" } | { readonly kind: "timeout" }

export type VideoProbeResult = { readonly kind: "ok"; readonly probe: VideoProbe } | VideoProbeError

const DEFAULT_TIMEOUT_MS = 5000

/**
 * Read intrinsic dimensions + duration from a video file by mounting it in
 * a hidden `<video preload="metadata">` and waiting for `loadedmetadata`.
 *
 * Browser-only: this exists alongside the pure `classifyAspect` so the
 * decision is unit-tested while the DOM coupling stays at the edge.
 *
 * Returns a typed Result rather than throwing — the caller (the listing
 * form) shows a soft warning, never blocks the upload.
 */
export async function probeVideo(
  file: File,
  options: { timeoutMs?: number } = {},
): Promise<VideoProbeResult> {
  if (typeof document === "undefined") return { kind: "load-error" }
  const url = URL.createObjectURL(file)
  const video = document.createElement("video")
  video.preload = "metadata"
  video.muted = true
  video.src = url

  try {
    return await new Promise<VideoProbeResult>((resolve) => {
      const timeout = window.setTimeout(() => {
        resolve({ kind: "timeout" })
      }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

      video.onloadedmetadata = () => {
        window.clearTimeout(timeout)
        resolve({
          kind: "ok",
          probe: {
            width: video.videoWidth,
            height: video.videoHeight,
            durationSec: video.duration,
            aspect: classifyAspect(video.videoWidth, video.videoHeight),
          },
        })
      }
      video.onerror = () => {
        window.clearTimeout(timeout)
        resolve({ kind: "load-error" })
      }
    })
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute("src")
  }
}
