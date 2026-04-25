import { describe, expect, it } from "vitest"

import { makeListing } from "../../tests/fixtures/listing"
import {
  AcTypeSchema,
  HeatTypeSchema,
  LaundryTypeSchema,
  ListingSchema,
  ListingStatusSchema,
  ListingTypeSchema,
  ParkingTypeSchema,
  PetPolicySchema,
  PropertyTypeSchema,
} from "./listing"

describe("ListingSchema", () => {
  it("accepts a minimal valid listing (only required fields)", () => {
    expect(ListingSchema.parse(makeListing()).id).toBe("apt-001")
  })

  it("accepts a fully-populated extended listing", () => {
    const full = makeListing({
      videoUrl: "https://x.com/v.mp4",
      listingType: "rent",
      propertyType: "apartment",
      status: "active",
      unitNumber: "3R",
      city: "New York",
      state: "NY",
      zip: "11215",
      photoUrls: ["a", "b"],
      floorPlanUrl: "fp.pdf",
      halfBaths: 1,
      lotSize: 1000,
      floorNumber: 3,
      totalFloors: 4,
      yearBuilt: 1925,
      parkingType: "garage",
      parkingSpots: 1,
      laundryType: "in-unit",
      petPolicy: "dogs-ok",
      isFurnished: true,
      acType: "central",
      heatType: "steam",
      utilitiesIncluded: ["heat"],
      availableDate: "2026-05-01",
      leaseTerms: ["1 year"],
      openHouseSlots: [{ date: "2026-05-01", time: "13:00", notes: "" }],
      securityDeposit: 4500,
      brokerFeeAmount: 0,
      brokerFeePct: 0,
      hoaFees: 0,
      propertyTaxesYear: 0,
    })
    expect(ListingSchema.parse(full).propertyType).toBe("apartment")
  })

  it("rejects a listing missing required fields", () => {
    expect(ListingSchema.safeParse({ id: "x" }).success).toBe(false)
  })

  it("rejects wrong types", () => {
    expect(
      ListingSchema.safeParse(makeListing({ price: "expensive" as unknown as number })).success,
    ).toBe(false)
  })

  it("rejects an unknown enum value for listingType", () => {
    expect(ListingSchema.safeParse(makeListing({ listingType: "lease" as never })).success).toBe(
      false,
    )
  })
})

describe("enum schemas", () => {
  it.each([
    [ListingTypeSchema, ["rent", "sale"], "lease"],
    [
      PropertyTypeSchema,
      ["apartment", "house", "condo", "townhouse", "co-op", "multi-family"],
      "yurt",
    ],
    [ListingStatusSchema, ["active", "pending", "off-market", "draft"], "leased"],
    [ParkingTypeSchema, ["none", "street", "garage"], "valet"],
    [LaundryTypeSchema, ["in-unit", "in-building", "none"], "laundromat"],
    [PetPolicySchema, ["no-pets", "cats-ok", "dogs-ok", "size-limit"], "any-pet"],
    [AcTypeSchema, ["central", "window", "none"], "ductless"],
    [HeatTypeSchema, ["electric", "gas", "steam", "radiant"], "wood"],
  ] as const)("accepts valid values and rejects invalid", (schema, validValues, invalid) => {
    for (const v of validValues) expect(schema.parse(v)).toBe(v)
    expect(schema.safeParse(invalid).success).toBe(false)
  })
})
