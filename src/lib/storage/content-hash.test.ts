import { describe, expect, it } from "vitest"

import { contentHashFilename, extensionOf } from "./content-hash"

describe("extensionOf", () => {
  it("returns the lowercased extension after the last dot", () => {
    expect(extensionOf("photo.JPG")).toBe("jpg")
    expect(extensionOf("clip.mp4")).toBe("mp4")
  })

  it("uses only the trailing extension on multi-dot names", () => {
    expect(extensionOf("backup.tar.gz")).toBe("gz")
  })

  it("returns 'bin' for names with no dot", () => {
    expect(extensionOf("README")).toBe("bin")
  })

  it("returns 'bin' for names that start with a dot but have nothing after", () => {
    expect(extensionOf(".hidden")).toBe("bin")
  })

  it("returns 'bin' when the name ends with a dot", () => {
    expect(extensionOf("photo.")).toBe("bin")
  })
})

describe("contentHashFilename", () => {
  it("returns a hex digest plus the lowercased extension", async () => {
    const file = new File(["hello"], "photo.JPG", { type: "image/jpeg" })
    const out = await contentHashFilename(file)
    expect(out).toMatch(/^[0-9a-f]{64}\.jpg$/)
  })

  it("is deterministic for identical contents", async () => {
    const a = new File(["same content"], "a.png")
    const b = new File(["same content"], "b.png")
    expect(await contentHashFilename(a)).toBe(await contentHashFilename(b))
  })

  it("differs when content differs (defeats the Date.now collision case)", async () => {
    const a = new File(["alpha"], "x.png")
    const b = new File(["beta"], "y.png")
    expect(await contentHashFilename(a)).not.toBe(await contentHashFilename(b))
  })

  it("matches the SHA-256 of an empty file", async () => {
    // Documented SHA-256 of the empty string.
    const empty = new File([], "nothing.bin")
    const out = await contentHashFilename(empty)
    expect(out).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855.bin")
  })
})
