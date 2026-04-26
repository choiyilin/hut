import { describe, expect, it } from "vitest"

import { geoListings, pickFitTarget } from "./map-fit"

describe("geoListings", () => {
  it("drops 0,0 listings (un-geocoded)", () => {
    const filtered = geoListings([
      { id: "a", lat: 0, lng: 0 },
      { id: "b", lat: 40.6, lng: -73.9 },
    ])
    expect(filtered.map((l) => l.id)).toEqual(["b"])
  })

  it("keeps a listing when only one of lat/lng is non-zero", () => {
    // Edge case: a listing in the Atlantic at exactly 0,X or X,0 is still
    // "geocoded" (just to a weird place). Better to show a wrong pin than
    // silently drop it — easier to debug.
    const out = geoListings([{ id: "x", lat: 40.6, lng: 0 }])
    expect(out).toHaveLength(1)
  })

  it("returns an empty array when all listings are un-geocoded", () => {
    expect(
      geoListings([
        { lat: 0, lng: 0 },
        { lat: 0, lng: 0 },
      ]),
    ).toEqual([])
  })
})

describe("pickFitTarget", () => {
  it("returns default-bounds for an empty list", () => {
    expect(pickFitTarget([])).toEqual({ kind: "default-bounds" })
  })

  it("returns a single-point target for one listing", () => {
    expect(pickFitTarget([{ lat: 40.6, lng: -73.9 }])).toEqual({
      kind: "single",
      center: [-73.9, 40.6],
    })
  })

  it("returns the encompassing bbox for many listings", () => {
    const listings = [
      { lat: 40.6, lng: -73.9 },
      { lat: 40.8, lng: -73.95 },
      { lat: 40.7, lng: -74.0 },
    ]
    expect(pickFitTarget(listings)).toEqual({
      kind: "bounds",
      southwest: [-74.0, 40.6],
      northeast: [-73.9, 40.8],
    })
  })

  it("returns a single-point target when all listings share the same coords", () => {
    const listings = [
      { lat: 40.7, lng: -74 },
      { lat: 40.7, lng: -74 },
    ]
    expect(pickFitTarget(listings)).toEqual({
      kind: "bounds",
      southwest: [-74, 40.7],
      northeast: [-74, 40.7],
    })
  })
})
