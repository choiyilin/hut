import type { Listing } from "@/schemas/listing"

/**
 * Factory for a fully-populated Listing. Mirrors the static-listing shape
 * (no listingType → treated as rent by the filter).
 */
export function makeListing(override: Partial<Listing> = {}): Listing {
  return {
    id: "apt-001",
    title: "247 Garfield Place, Apt 3R",
    price: 4500,
    beds: 2,
    baths: 1,
    sqft: 950,
    address: "247 Garfield Place, Brooklyn, NY 11215",
    neighborhood: "Park Slope",
    lat: 40.673,
    lng: -73.978,
    imageUrl: "https://example.com/image.jpg",
    amenities: ["dishwasher", "elevator"],
    description: "Bright two-bedroom on a tree-lined Park Slope block.",
    datePosted: "2026-04-01T12:00:00Z",
    featured: false,
    ...override,
  }
}
