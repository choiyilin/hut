import { describe, expect, it } from "vitest"

import { makeRealtorRow } from "../../tests/fixtures/realtor-listing-row"
import { realtorRowToListing } from "./realtor-row-to-listing"

describe("realtorRowToListing", () => {
  describe("baths", () => {
    it("adds 0.5 when half_baths > 0", () => {
      expect(realtorRowToListing(makeRealtorRow({ baths: 2, half_baths: 1 })).baths).toBe(2.5)
    })

    it("does not add 0.5 when half_baths is 0", () => {
      expect(realtorRowToListing(makeRealtorRow({ baths: 2, half_baths: 0 })).baths).toBe(2)
    })

    it("surfaces halfBaths only when > 0", () => {
      expect(realtorRowToListing(makeRealtorRow({ half_baths: 0 })).halfBaths).toBeUndefined()
      expect(realtorRowToListing(makeRealtorRow({ half_baths: 1 })).halfBaths).toBe(1)
    })
  })

  describe("imageUrl + photoUrls", () => {
    it("uses the first photo_urls entry as imageUrl", () => {
      expect(realtorRowToListing(makeRealtorRow({ photo_urls: ["a.jpg", "b.jpg"] })).imageUrl).toBe(
        "a.jpg",
      )
    })

    it("falls back to image_url when photo_urls is empty", () => {
      expect(
        realtorRowToListing(makeRealtorRow({ photo_urls: [], image_url: "fallback.jpg" })).imageUrl,
      ).toBe("fallback.jpg")
    })

    it("surfaces photoUrls only when non-empty", () => {
      expect(realtorRowToListing(makeRealtorRow({ photo_urls: [] })).photoUrls).toBeUndefined()
      expect(realtorRowToListing(makeRealtorRow({ photo_urls: ["a"] })).photoUrls).toEqual(["a"])
    })
  })

  describe("nullable fields → undefined", () => {
    it.each([
      ["video_url", "videoUrl"],
      ["unit_number", "unitNumber"],
      ["city", "city"],
      ["state", "state"],
      ["zip", "zip"],
      ["floor_plan_url", "floorPlanUrl"],
      ["lot_size", "lotSize"],
      ["floor_number", "floorNumber"],
      ["total_floors", "totalFloors"],
      ["year_built", "yearBuilt"],
      ["available_date", "availableDate"],
      ["security_deposit", "securityDeposit"],
      ["broker_fee_amount", "brokerFeeAmount"],
      ["broker_fee_pct", "brokerFeePct"],
      ["hoa_fees", "hoaFees"],
      ["property_taxes_year", "propertyTaxesYear"],
    ] as const)("%s = null → %s undefined", (rowKey, listingKey) => {
      const row = makeRealtorRow({ [rowKey]: null })
      const result = realtorRowToListing(row) as Record<string, unknown>
      expect(result[listingKey]).toBeUndefined()
    })
  })

  describe("status", () => {
    it("preserves status when present", () => {
      expect(realtorRowToListing(makeRealtorRow({ status: "pending" })).status).toBe("pending")
    })

    it("maps null status to undefined", () => {
      expect(realtorRowToListing(makeRealtorRow({ status: null })).status).toBeUndefined()
    })
  })

  describe("enum coercion", () => {
    it("preserves valid listing_type", () => {
      expect(realtorRowToListing(makeRealtorRow({ listing_type: "sale" })).listingType).toBe("sale")
    })

    it("maps invalid listing_type to undefined", () => {
      expect(
        realtorRowToListing(makeRealtorRow({ listing_type: "lease" })).listingType,
      ).toBeUndefined()
    })

    it("maps null listing_type to undefined", () => {
      expect(
        realtorRowToListing(makeRealtorRow({ listing_type: null })).listingType,
      ).toBeUndefined()
    })

    it.each([
      ["property_type", "propertyType", "house", "yurt"],
      ["parking_type", "parkingType", "garage", "valet"],
      ["laundry_type", "laundryType", "in-unit", "laundromat"],
      ["pet_policy", "petPolicy", "dogs-ok", "snakes-ok"],
      ["ac_type", "acType", "central", "ductless"],
    ] as const)("%s preserves valid value, drops invalid", (rowKey, listingKey, valid, invalid) => {
      const ok = realtorRowToListing(makeRealtorRow({ [rowKey]: valid })) as Record<string, unknown>
      expect(ok[listingKey]).toBe(valid)
      const bad = realtorRowToListing(makeRealtorRow({ [rowKey]: invalid })) as Record<
        string,
        unknown
      >
      expect(bad[listingKey]).toBeUndefined()
    })

    it("preserves valid heat_type", () => {
      expect(realtorRowToListing(makeRealtorRow({ heat_type: "gas" })).heatType).toBe("gas")
    })

    it("maps null heat_type to undefined", () => {
      expect(realtorRowToListing(makeRealtorRow({ heat_type: null })).heatType).toBeUndefined()
    })

    it("maps invalid heat_type to undefined", () => {
      expect(realtorRowToListing(makeRealtorRow({ heat_type: "wood" })).heatType).toBeUndefined()
    })
  })

  describe("array fields surface only when non-empty", () => {
    it("utilities_included → utilitiesIncluded", () => {
      expect(
        realtorRowToListing(makeRealtorRow({ utilities_included: [] })).utilitiesIncluded,
      ).toBeUndefined()
      expect(
        realtorRowToListing(makeRealtorRow({ utilities_included: ["heat"] })).utilitiesIncluded,
      ).toEqual(["heat"])
    })

    it("lease_terms → leaseTerms", () => {
      expect(realtorRowToListing(makeRealtorRow({ lease_terms: [] })).leaseTerms).toBeUndefined()
      expect(realtorRowToListing(makeRealtorRow({ lease_terms: ["1 year"] })).leaseTerms).toEqual([
        "1 year",
      ])
    })

    it("open_house_slots → openHouseSlots", () => {
      expect(
        realtorRowToListing(makeRealtorRow({ open_house_slots: [] })).openHouseSlots,
      ).toBeUndefined()
      const slots = [{ date: "2026-05-01", time: "13:00", notes: "" }]
      expect(
        realtorRowToListing(makeRealtorRow({ open_house_slots: slots })).openHouseSlots,
      ).toEqual(slots)
    })
  })

  describe("parking_spots", () => {
    it("surfaces parkingSpots only when > 0", () => {
      expect(realtorRowToListing(makeRealtorRow({ parking_spots: 0 })).parkingSpots).toBeUndefined()
      expect(realtorRowToListing(makeRealtorRow({ parking_spots: 2 })).parkingSpots).toBe(2)
    })
  })

  describe("scalar passthroughs", () => {
    it("copies primitive fields straight across", () => {
      const row = makeRealtorRow({
        title: "X",
        price: 9999,
        beds: 3,
        sqft: 800,
        address: "Y",
        neighborhood: "Z",
        lat: 40.7,
        lng: -73.9,
        amenities: ["doorman"],
        description: "Q",
        date_posted: "2026-01-01",
        featured: true,
        is_furnished: true,
      })
      const out = realtorRowToListing(row)
      expect(out).toMatchObject({
        title: "X",
        price: 9999,
        beds: 3,
        sqft: 800,
        address: "Y",
        neighborhood: "Z",
        lat: 40.7,
        lng: -73.9,
        amenities: ["doorman"],
        description: "Q",
        datePosted: "2026-01-01",
        featured: true,
        isFurnished: true,
      })
    })
  })
})
