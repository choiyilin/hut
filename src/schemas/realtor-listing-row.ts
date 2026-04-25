import { z } from "zod"

import { ListingStatusSchema } from "./listing"
import { OpenHouseSlotSchema } from "./open-house-slot"

// ── DB row shape for realtor_listings (snake_case to match Postgres) ─────────
//
// Use this schema to validate every row coming back from Supabase before
// handing it to the rest of the app. `image_url`, `amenities`, `photo_urls`,
// etc. all have DB defaults so existing rows are guaranteed to satisfy this.

export const RealtorListingRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  price: z.number(),
  beds: z.number(),
  baths: z.number(),
  half_baths: z.number(),
  sqft: z.number(),
  address: z.string(),
  neighborhood: z.string(),
  lat: z.number(),
  lng: z.number(),
  image_url: z.string(),
  amenities: z.array(z.string()),
  description: z.string(),
  date_posted: z.string(),
  featured: z.boolean(),

  // Free-form strings that may be persisted with values outside our enum —
  // realtorRowToListing maps invalid values to undefined.
  listing_type: z.string().nullable(),
  property_type: z.string().nullable(),
  status: ListingStatusSchema.nullable(),

  unit_number: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  security_deposit: z.number().nullable(),
  has_broker_fee: z.boolean(),
  broker_fee_amount: z.number().nullable(),
  broker_fee_pct: z.number().nullable(),
  hoa_fees: z.number().nullable(),
  property_taxes_year: z.number().nullable(),
  lot_size: z.number().nullable(),
  floor_number: z.number().nullable(),
  total_floors: z.number().nullable(),
  year_built: z.number().nullable(),
  photo_urls: z.array(z.string()),
  video_url: z.string().nullable(),
  floor_plan_url: z.string().nullable(),

  // String columns that mirror enums in the form layer but live unrestricted
  // in the DB.
  parking_type: z.string(),
  parking_spots: z.number(),
  laundry_type: z.string(),

  has_balcony: z.boolean(),
  has_terrace: z.boolean(),
  has_backyard: z.boolean(),
  has_roof_deck: z.boolean(),
  pet_policy: z.string(),
  is_furnished: z.boolean(),
  has_storage: z.boolean(),
  has_doorman: z.boolean(),
  has_elevator: z.boolean(),
  has_gym: z.boolean(),
  has_pool: z.boolean(),
  has_rooftop: z.boolean(),
  has_package_room: z.boolean(),
  has_bike_room: z.boolean(),
  has_ev_charging: z.boolean(),
  has_live_in_super: z.boolean(),
  is_accessible: z.boolean(),
  ac_type: z.string(),
  heat_type: z.string().nullable(),
  utilities_included: z.array(z.string()),
  flooring_type: z.string().nullable(),
  has_dishwasher: z.boolean(),
  has_microwave: z.boolean(),
  has_washer_dryer: z.boolean(),
  available_date: z.string().nullable(),
  lease_terms: z.array(z.string()),
  open_house_slots: z.array(OpenHouseSlotSchema),
})

export type RealtorListingRow = z.infer<typeof RealtorListingRowSchema>
