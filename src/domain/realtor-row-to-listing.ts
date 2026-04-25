import type { z } from "zod"

import {
  AcTypeSchema,
  HeatTypeSchema,
  LaundryTypeSchema,
  ListingTypeSchema,
  ParkingTypeSchema,
  PetPolicySchema,
  PropertyTypeSchema,
  type Listing,
} from "@/schemas/listing"
import type { RealtorListingRow } from "@/schemas/realtor-listing-row"

/**
 * Coerce a free-form string column into one of the schema's allowed enum
 * values. Anything that doesn't match becomes undefined — the caller decides
 * what to do with it (default, omit, surface in admin, etc.).
 */
function safeEnum<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> | undefined {
  const result = schema.safeParse(value)
  return result.success ? result.data : undefined
}

/**
 * Maps a Postgres realtor_listings row → the app's Listing shape.
 *
 * Pure: no I/O, no globals. Everything you need to test it is in the input row.
 *
 * Behaviour preserved verbatim from the legacy types/index.ts implementation:
 *   - half_baths > 0 adds 0.5 to baths
 *   - First photo_url wins; falls back to image_url
 *   - photo_urls only surfaces if non-empty (otherwise omitted)
 *   - parking_spots > 0 surfaces; 0 is omitted
 *   - utilities/lease/open-house arrays only surface if non-empty
 *   - Invalid enum strings (e.g. property_type="bunker") map to undefined
 */
export function realtorRowToListing(row: RealtorListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    beds: row.beds,
    baths: row.baths + (row.half_baths > 0 ? 0.5 : 0),
    sqft: row.sqft,
    address: row.address,
    neighborhood: row.neighborhood,
    lat: row.lat,
    lng: row.lng,
    imageUrl: row.photo_urls[0] ?? row.image_url,
    videoUrl: row.video_url ?? undefined,
    amenities: row.amenities,
    description: row.description,
    datePosted: row.date_posted,
    featured: row.featured,
    listingType: safeEnum(ListingTypeSchema, row.listing_type),
    propertyType: safeEnum(PropertyTypeSchema, row.property_type),
    status: row.status ?? undefined,
    unitNumber: row.unit_number ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    zip: row.zip ?? undefined,
    photoUrls: row.photo_urls.length > 0 ? row.photo_urls : undefined,
    floorPlanUrl: row.floor_plan_url ?? undefined,
    halfBaths: row.half_baths > 0 ? row.half_baths : undefined,
    lotSize: row.lot_size ?? undefined,
    floorNumber: row.floor_number ?? undefined,
    totalFloors: row.total_floors ?? undefined,
    yearBuilt: row.year_built ?? undefined,
    parkingType: safeEnum(ParkingTypeSchema, row.parking_type),
    parkingSpots: row.parking_spots > 0 ? row.parking_spots : undefined,
    laundryType: safeEnum(LaundryTypeSchema, row.laundry_type),
    petPolicy: safeEnum(PetPolicySchema, row.pet_policy),
    isFurnished: row.is_furnished,
    acType: safeEnum(AcTypeSchema, row.ac_type),
    heatType: safeEnum(HeatTypeSchema, row.heat_type),
    utilitiesIncluded: row.utilities_included.length > 0 ? row.utilities_included : undefined,
    availableDate: row.available_date ?? undefined,
    leaseTerms: row.lease_terms.length > 0 ? row.lease_terms : undefined,
    openHouseSlots: row.open_house_slots.length > 0 ? row.open_house_slots : undefined,
    securityDeposit: row.security_deposit ?? undefined,
    brokerFeeAmount: row.broker_fee_amount ?? undefined,
    brokerFeePct: row.broker_fee_pct ?? undefined,
    hoaFees: row.hoa_fees ?? undefined,
    propertyTaxesYear: row.property_taxes_year ?? undefined,
  }
}
