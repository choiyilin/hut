import { afterEach, describe, expect, it, vi } from "vitest"

import { probeVideo } from "./probe-video"

type VideoStub = {
  preload: string
  muted: boolean
  src: string
  videoWidth: number
  videoHeight: number
  duration: number
  onloadedmetadata: (() => void) | null
  onerror: (() => void) | null
  removeAttribute: (name: string) => void
}

function installVideoStub(stub: Partial<VideoStub>): VideoStub {
  const video: VideoStub = {
    preload: "",
    muted: false,
    src: "",
    videoWidth: 0,
    videoHeight: 0,
    duration: 0,
    onloadedmetadata: null,
    onerror: null,
    removeAttribute: vi.fn(),
    ...stub,
  }
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "video") return video as unknown as HTMLElement
    return globalThis.document.createElement(tag)
  })
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake")
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
  return video
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("probeVideo", () => {
  it("returns probe data when loadedmetadata fires", async () => {
    const video = installVideoStub({
      videoWidth: 1080,
      videoHeight: 1920,
      duration: 12.5,
    })
    const file = new File([new Uint8Array([0])], "clip.mp4", { type: "video/mp4" })
    const promise = probeVideo(file)
    // Fire the success callback synchronously.
    video.onloadedmetadata?.()
    const result = await promise
    expect(result).toEqual({
      kind: "ok",
      probe: { width: 1080, height: 1920, durationSec: 12.5, aspect: "9-16" },
    })
  })

  it("returns a load-error when the video element's onerror fires", async () => {
    const video = installVideoStub({})
    const file = new File([new Uint8Array([0])], "broken.mp4")
    const promise = probeVideo(file)
    video.onerror?.()
    expect(await promise).toEqual({ kind: "load-error" })
  })

  it("returns a timeout when neither callback fires within the deadline", async () => {
    installVideoStub({})
    const file = new File([new Uint8Array([0])], "stuck.mp4")
    vi.useFakeTimers()
    try {
      const promise = probeVideo(file, { timeoutMs: 100 })
      await vi.advanceTimersByTimeAsync(101)
      expect(await promise).toEqual({ kind: "timeout" })
    } finally {
      vi.useRealTimers()
    }
  })

  it("returns a load-error when called outside a browser (no document)", async () => {
    const orig = globalThis.document
    // @ts-expect-error — intentionally simulating SSR where document is absent
    delete globalThis.document
    try {
      const file = new File([], "x.mp4")
      expect(await probeVideo(file)).toEqual({ kind: "load-error" })
    } finally {
      globalThis.document = orig
    }
  })
})
