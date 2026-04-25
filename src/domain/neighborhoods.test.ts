import { describe, expect, it } from "vitest"

import type { BoroughData } from "@/data/nyc-neighborhoods"

import { buildParentToSubs, matchesNeighborhoodSelection, PARENT_TO_SUBS } from "./neighborhoods"

describe("PARENT_TO_SUBS", () => {
  it("is non-empty (curated NYC data has at least one parent→sub group)", () => {
    expect(PARENT_TO_SUBS.size).toBeGreaterThan(0)
  })

  it("has at least one entry where the value set has multiple subs", () => {
    const anyMulti = [...PARENT_TO_SUBS.values()].some((subs) => subs.size > 1)
    expect(anyMulti).toBe(true)
  })

  it("groups Chelsea → West Chelsea (curated NYC data invariant)", () => {
    expect(PARENT_TO_SUBS.get("Chelsea")?.has("West Chelsea")).toBe(true)
  })
})

describe("matchesNeighborhoodSelection", () => {
  it("returns true when no filter is selected", () => {
    expect(matchesNeighborhoodSelection("Park Slope", [])).toBe(true)
  })

  it("matches by exact neighborhood name", () => {
    expect(matchesNeighborhoodSelection("Park Slope", ["Park Slope"])).toBe(true)
  })

  it("returns false when no selection matches", () => {
    expect(matchesNeighborhoodSelection("Astoria", ["Park Slope", "DUMBO"])).toBe(false)
  })

  it("matches sub-neighborhood when its parent is selected", () => {
    // Hardcoded against the curated dataset — keeps the test deterministic
    // and regression-friendly if the data shape changes.
    expect(matchesNeighborhoodSelection("West Chelsea", ["Chelsea"])).toBe(true)
  })

  it("does not match a parent when only an unrelated label is selected", () => {
    expect(
      matchesNeighborhoodSelection("Chelsea", ["__definitely-not-a-real-neighborhood__"]),
    ).toBe(false)
  })
})

describe("buildParentToSubs (malformed-data branch)", () => {
  it("silently skips sub-neighborhoods that appear before any parent", () => {
    const malformed: BoroughData[] = [
      {
        id: "MANHATTAN",
        label: "Test Borough",
        areas: [
          {
            area: "Test Area",
            neighborhoods: [
              { name: "Orphan Sub", sub: true },
              { name: "Real Parent" },
              { name: "Valid Sub", sub: true },
            ],
          },
        ],
      },
    ]
    const result = buildParentToSubs(malformed)
    expect(result.has("Orphan Sub")).toBe(false)
    expect(result.get("Real Parent")).toEqual(new Set(["Valid Sub"]))
  })

  it("emits no entry for a parent that has no subs", () => {
    const flat: BoroughData[] = [
      {
        id: "MANHATTAN",
        label: "B",
        areas: [{ area: "A", neighborhoods: [{ name: "Solo" }] }],
      },
    ]
    expect(buildParentToSubs(flat).size).toBe(0)
  })
})
