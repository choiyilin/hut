import { z } from "zod"

import { OpenHouseSlotSchema } from "./open-house-slot"

// ── Enums shared between Listing (app-facing) and RealtorListingRow (DB) ─────

export const ListingTypeSchema = z.enum(["rent", "sale"])
export const PropertyTypeSchema = z.enum([
  "apartment",
  "house",
  "condo",
  "townhouse",
  "co-op",
  "multi-family",
])
export const ListingStatusSchema = z.enum(["active", "pending", "off-market", "draft"])
export const ParkingTypeSchema = z.enum(["none", "street", "garage"])
export const LaundryTypeSchema = z.enum(["in-unit", "in-building", "none"])
export const PetPolicySchema = z.enum(["no-pets", "cats-ok", "dogs-ok", "size-limit"])
export const AcTypeSchema = z.enum(["central", "window", "none"])
export const HeatTypeSchema = z.enum(["electric", "gas", "steam", "radiant"])

// ── Listing — the app-facing shape that components consume ───────────────────

export const ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  beds: z.number(),
  baths: z.number(),
  sqft: z.number(),
  address: z.string(),
  neighborhood: z.string(),
  lat: z.number(),
  lng: z.number(),
  imageUrl: z.string(),
  videoUrl: z.string().optional(),
  amenities: z.array(z.string()),
  description: z.string(),
  datePosted: z.string(),
  featured: z.boolean(),
  // Extended fields — present on realtor-uploaded listings, absent on static mocks.
  listingType: ListingTypeSchema.optional(),
  propertyType: PropertyTypeSchema.optional(),
  status: ListingStatusSchema.optional(),
  unitNumber: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  floorPlanUrl: z.string().optional(),
  halfBaths: z.number().optional(),
  lotSize: z.number().optional(),
  floorNumber: z.number().optional(),
  totalFloors: z.number().optional(),
  yearBuilt: z.number().optional(),
  parkingType: ParkingTypeSchema.optional(),
  parkingSpots: z.number().optional(),
  laundryType: LaundryTypeSchema.optional(),
  petPolicy: PetPolicySchema.optional(),
  isFurnished: z.boolean().optional(),
  acType: AcTypeSchema.optional(),
  heatType: HeatTypeSchema.optional(),
  utilitiesIncluded: z.array(z.string()).optional(),
  availableDate: z.string().optional(),
  leaseTerms: z.array(z.string()).optional(),
  openHouseSlots: z.array(OpenHouseSlotSchema).optional(),
  securityDeposit: z.number().optional(),
  brokerFeeAmount: z.number().optional(),
  brokerFeePct: z.number().optional(),
  hoaFees: z.number().optional(),
  propertyTaxesYear: z.number().optional(),
})

export type Listing = z.infer<typeof ListingSchema>
export type ListingType = z.infer<typeof ListingTypeSchema>
export type PropertyType = z.infer<typeof PropertyTypeSchema>
export type ListingStatus = z.infer<typeof ListingStatusSchema>
export type ParkingType = z.infer<typeof ParkingTypeSchema>
export type LaundryType = z.infer<typeof LaundryTypeSchema>
export type PetPolicy = z.infer<typeof PetPolicySchema>
export type AcType = z.infer<typeof AcTypeSchema>
export type HeatType = z.infer<typeof HeatTypeSchema>
