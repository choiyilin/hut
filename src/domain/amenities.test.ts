import { describe, expect, it } from "vitest"

import { deriveAmenities, type AmenitySource } from "./amenities"

function source(override: Partial<AmenitySource> = {}): AmenitySource {
  return {
    hasDoorman: false,
    hasElevator: false,
    hasGym: false,
    hasPool: false,
    hasCommunalOutdoor: false,
    hasChildrensRoom: false,
    isSmokeFree: false,
    isAccessible: false,
    guarantorsAccepted: false,
    laundryType: "none",
    hasDishwasher: false,
    acType: "none",
    isFurnished: false,
    hasStorage: false,
    parkingType: "none",
    hasBalcony: false,
    hasTerrace: false,
    hasBackyard: false,
    hasRoofDeck: false,
    petPolicy: "no-pets",
    ...override,
  }
}

describe("deriveAmenities", () => {
  it("returns an empty list for an all-default source", () => {
    expect(deriveAmenities(source())).toEqual([])
  })

  it.each([
    ["hasDoorman", "doorman"],
    ["hasElevator", "elevator"],
    ["hasGym", "gym"],
    ["hasPool", "swimming pool/sauna"],
    ["hasCommunalOutdoor", "communal outdoor space"],
    ["hasChildrensRoom", "children's room"],
    ["isSmokeFree", "smoke free"],
    ["isAccessible", "accessible"],
    ["guarantorsAccepted", "guarantors accepted"],
    ["hasDishwasher", "dishwasher"],
    ["isFurnished", "furnished"],
    ["hasStorage", "storage"],
  ] as const)("toggling %s adds %s", (flag, expected) => {
    expect(deriveAmenities(source({ [flag]: true }))).toContain(expected)
  })

  it.each([
    ["in-unit", "laundry in-unit"],
    ["in-building", "laundry in-building"],
  ] as const)("laundryType=%s adds %s", (type, expected) => {
    expect(deriveAmenities(source({ laundryType: type }))).toContain(expected)
  })

  it("laundryType=none adds nothing for laundry", () => {
    const out = deriveAmenities(source({ laundryType: "none" }))
    expect(out.some((a) => a.startsWith("laundry"))).toBe(false)
  })

  it("acType central → 'central AC'; window/none add nothing", () => {
    expect(deriveAmenities(source({ acType: "central" }))).toContain("central AC")
    expect(deriveAmenities(source({ acType: "window" })).some((a) => a.includes("AC"))).toBe(false)
    expect(deriveAmenities(source({ acType: "none" })).some((a) => a.includes("AC"))).toBe(false)
  })

  it.each([
    ["street", true],
    ["garage", true],
    ["none", false],
  ] as const)("parkingType=%s parking included? %s", (type, included) => {
    expect(deriveAmenities(source({ parkingType: type })).includes("parking")).toBe(included)
  })

  it.each(["hasBalcony", "hasTerrace", "hasBackyard", "hasRoofDeck"] as const)(
    "%s flips on 'outdoor space' (and dedupes when multiple are set)",
    (flag) => {
      expect(deriveAmenities(source({ [flag]: true }))).toContain("outdoor space")
    },
  )

  it("multiple outdoor flags only add 'outdoor space' once", () => {
    const out = deriveAmenities(
      source({ hasBalcony: true, hasTerrace: true, hasBackyard: true, hasRoofDeck: true }),
    )
    expect(out.filter((a) => a === "outdoor space")).toHaveLength(1)
  })

  it.each(["cats-ok", "dogs-ok", "size-limit"] as const)(
    "petPolicy=%s adds 'pets allowed'",
    (p) => {
      expect(deriveAmenities(source({ petPolicy: p }))).toContain("pets allowed")
    },
  )

  it("petPolicy=no-pets does not add 'pets allowed'", () => {
    expect(deriveAmenities(source({ petPolicy: "no-pets" })).includes("pets allowed")).toBe(false)
  })

  it("the result is deduplicated", () => {
    const out = deriveAmenities(source({ hasDoorman: true }))
    expect(new Set(out).size).toBe(out.length)
  })
})
