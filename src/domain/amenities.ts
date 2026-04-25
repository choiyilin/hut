import type { AcType, LaundryType, ParkingType, PetPolicy } from "@/schemas/listing"

/**
 * Slim shape of the AddListingForm fields that contribute amenities.
 * The form's full FormState is a structural superset of this and may be
 * passed directly. Phase 5 will fold AmenitySource into the form's own
 * Zod schema so this duplication disappears.
 */
export type AmenitySource = {
  hasDoorman: boolean
  hasElevator: boolean
  hasGym: boolean
  hasPool: boolean
  hasCommunalOutdoor: boolean
  hasChildrensRoom: boolean
  isSmokeFree: boolean
  isAccessible: boolean
  guarantorsAccepted: boolean
  laundryType: LaundryType
  hasDishwasher: boolean
  acType: AcType
  isFurnished: boolean
  hasStorage: boolean
  parkingType: ParkingType
  hasBalcony: boolean
  hasTerrace: boolean
  hasBackyard: boolean
  hasRoofDeck: boolean
  petPolicy: PetPolicy
}

/**
 * Maps boolean form fields → the exact amenity strings used by the filter UI.
 *
 * The strings here MUST stay aligned with the labels in FilterBar/FilterSidebar
 * checkboxes — listings whose amenities[] don't match exactly won't appear when
 * filtered. Result is deduplicated.
 */
export function deriveAmenities(input: AmenitySource): string[] {
  const derived: string[] = []
  if (input.hasDoorman) derived.push("doorman")
  if (input.hasElevator) derived.push("elevator")
  if (input.hasGym) derived.push("gym")
  if (input.hasPool) derived.push("swimming pool/sauna")
  if (input.hasCommunalOutdoor) derived.push("communal outdoor space")
  if (input.hasChildrensRoom) derived.push("children's room")
  if (input.isSmokeFree) derived.push("smoke free")
  if (input.isAccessible) derived.push("accessible")
  if (input.guarantorsAccepted) derived.push("guarantors accepted")
  if (input.laundryType === "in-unit") derived.push("laundry in-unit")
  if (input.laundryType === "in-building") derived.push("laundry in-building")
  if (input.hasDishwasher) derived.push("dishwasher")
  if (input.acType === "central") derived.push("central AC")
  if (input.isFurnished) derived.push("furnished")
  if (input.hasStorage) derived.push("storage")
  if (input.parkingType !== "none") derived.push("parking")
  if (input.hasBalcony || input.hasTerrace || input.hasBackyard || input.hasRoofDeck) {
    derived.push("outdoor space")
  }
  if (input.petPolicy !== "no-pets") derived.push("pets allowed")
  return [...new Set(derived)]
}
