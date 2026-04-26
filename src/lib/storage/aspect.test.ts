import { describe, expect, it } from "vitest"

import { classifyAspect, isReelsCompatible } from "./aspect"

describe("classifyAspect", () => {
  it("accepts true 9:16 dimensions", () => {
    expect(classifyAspect(1080, 1920)).toBe("9-16")
    expect(classifyAspect(720, 1280)).toBe("9-16")
  })

  it("accepts iPhone-recorded 9:16-ish (1170x2080) within default tolerance", () => {
    // Modern iPhones often report slightly off ratios due to encoding —
    // 0.5625 default ± 0.03 catches them.
    expect(classifyAspect(1170, 2080)).toBe("9-16")
  })

  it("rejects 16:9 landscape", () => {
    expect(classifyAspect(1920, 1080)).toBe("landscape")
  })

  it("rejects square", () => {
    expect(classifyAspect(1000, 1000)).toBe("square")
  })

  it("rejects 4:5 portrait (Instagram feed) as portrait-other", () => {
    expect(classifyAspect(1080, 1350)).toBe("portrait-other")
  })

  it("returns 'unknown' for non-positive or non-finite inputs", () => {
    expect(classifyAspect(0, 1080)).toBe("unknown")
    expect(classifyAspect(1080, 0)).toBe("unknown")
    expect(classifyAspect(-100, 100)).toBe("unknown")
    expect(classifyAspect(Number.NaN, 100)).toBe("unknown")
    expect(classifyAspect(Infinity, 100)).toBe("unknown")
  })

  it("respects a custom tolerance", () => {
    // 16:9 with a generous tolerance still won't pass for 9:16 — they
    // differ by ~1.2 in ratio, far beyond any sane tolerance.
    expect(classifyAspect(1920, 1080, 0.5)).toBe("landscape")
    // But near-square at very tight tolerance is portrait-other instead of square.
    expect(classifyAspect(1000, 1010, 0.001)).toBe("portrait-other")
  })
})

describe("isReelsCompatible", () => {
  it("is true for 9:16 inputs", () => {
    expect(isReelsCompatible(1080, 1920)).toBe(true)
  })

  it("is false for non-9:16", () => {
    expect(isReelsCompatible(1920, 1080)).toBe(false)
    expect(isReelsCompatible(1000, 1000)).toBe(false)
  })

  it("is false for invalid inputs", () => {
    expect(isReelsCompatible(0, 0)).toBe(false)
  })
})
