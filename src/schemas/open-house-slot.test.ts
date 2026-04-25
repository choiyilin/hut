import { describe, expect, it } from "vitest"

import { OpenHouseSlotSchema } from "./open-house-slot"

describe("OpenHouseSlotSchema", () => {
  it("accepts a fully-populated slot", () => {
    expect(
      OpenHouseSlotSchema.parse({
        date: "2026-05-01",
        time: "13:00",
        notes: "Bring shoes off",
      }),
    ).toEqual({ date: "2026-05-01", time: "13:00", notes: "Bring shoes off" })
  })

  it("rejects when a required field is missing", () => {
    expect(OpenHouseSlotSchema.safeParse({ date: "2026-05-01", time: "13:00" }).success).toBe(false)
  })

  it("rejects wrong types", () => {
    expect(
      OpenHouseSlotSchema.safeParse({ date: 20260501, time: "13:00", notes: "" }).success,
    ).toBe(false)
  })
})
