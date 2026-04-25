import { describe, expect, it } from "vitest"

import { makeRealtorRow } from "../../tests/fixtures/realtor-listing-row"
import { RealtorListingRowSchema } from "./realtor-listing-row"

describe("RealtorListingRowSchema", () => {
  it("accepts a fully populated row", () => {
    expect(RealtorListingRowSchema.parse(makeRealtorRow()).id).toBe("row-1")
  })

  it("accepts nullable fields when null", () => {
    expect(
      RealtorListingRowSchema.parse(
        makeRealtorRow({
          listing_type: null,
          property_type: null,
          status: null,
          unit_number: null,
          city: null,
          state: null,
          zip: null,
          security_deposit: null,
          broker_fee_amount: null,
          broker_fee_pct: null,
          hoa_fees: null,
          property_taxes_year: null,
          lot_size: null,
          floor_number: null,
          total_floors: null,
          year_built: null,
          video_url: null,
          floor_plan_url: null,
          heat_type: null,
          flooring_type: null,
          available_date: null,
        }),
      ).city,
    ).toBeNull()
  })

  it("rejects a row missing required fields", () => {
    expect(RealtorListingRowSchema.safeParse({ id: "x" }).success).toBe(false)
  })

  it("rejects an invalid status enum value", () => {
    expect(
      RealtorListingRowSchema.safeParse(makeRealtorRow({ status: "leased" as never })).success,
    ).toBe(false)
  })

  it("rejects wrong scalar types", () => {
    expect(
      RealtorListingRowSchema.safeParse(makeRealtorRow({ price: "free" as unknown as number }))
        .success,
    ).toBe(false)
  })
})
