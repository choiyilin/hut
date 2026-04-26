import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ANON_STORAGE_KEY, STORAGE_KEY_PREFIX, localStorageAdapter, storageKeyFor } from "./storage"

describe("storageKeyFor", () => {
  it("returns the anon key when userId is null", () => {
    expect(storageKeyFor(null)).toBe(ANON_STORAGE_KEY)
  })

  it("namespaces by userId when present", () => {
    expect(storageKeyFor("user-123")).toBe(`${STORAGE_KEY_PREFIX}user-123`)
  })
})

describe("localStorageAdapter", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("load", () => {
    it("returns an empty set when no entry exists", async () => {
      expect(await localStorageAdapter.load(null)).toEqual(new Set())
    })

    it("parses a stored array of IDs", async () => {
      window.localStorage.setItem(storageKeyFor("u1"), JSON.stringify(["a", "b"]))
      expect(await localStorageAdapter.load("u1")).toEqual(new Set(["a", "b"]))
    })

    it("returns an empty set on malformed JSON", async () => {
      window.localStorage.setItem(storageKeyFor(null), "{not json")
      expect(await localStorageAdapter.load(null)).toEqual(new Set())
    })

    it("returns an empty set when the parsed shape is wrong", async () => {
      window.localStorage.setItem(storageKeyFor(null), JSON.stringify({ foo: 1 }))
      expect(await localStorageAdapter.load(null)).toEqual(new Set())
    })

    it("returns an empty set when getItem throws", async () => {
      vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
        throw new Error("blocked")
      })
      expect(await localStorageAdapter.load(null)).toEqual(new Set())
    })

    it("namespaces reads by user", async () => {
      window.localStorage.setItem(storageKeyFor("u1"), JSON.stringify(["a"]))
      window.localStorage.setItem(storageKeyFor("u2"), JSON.stringify(["b"]))
      expect(await localStorageAdapter.load("u1")).toEqual(new Set(["a"]))
      expect(await localStorageAdapter.load("u2")).toEqual(new Set(["b"]))
    })
  })

  describe("save", () => {
    it("writes IDs as a JSON array under the namespaced key", async () => {
      await localStorageAdapter.save("u1", new Set(["a", "b"]))
      const raw = window.localStorage.getItem(storageKeyFor("u1"))
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw ?? "null")).toEqual(["a", "b"])
    })

    it("uses the anon key when userId is null", async () => {
      await localStorageAdapter.save(null, new Set(["a"]))
      expect(window.localStorage.getItem(ANON_STORAGE_KEY)).toBe(JSON.stringify(["a"]))
    })

    it("swallows quota / write errors so the UI is not broken by storage failures", async () => {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        throw new Error("quota")
      })
      await expect(localStorageAdapter.save(null, new Set(["a"]))).resolves.toBeUndefined()
    })
  })
})
