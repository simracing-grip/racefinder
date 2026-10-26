import type { Category, Listing, ListingDetails, IndoorOutdoor } from "@/lib/types";
import type { listings as listingsTable } from "@/lib/db/schema";
import { normalizeCountry } from "@/lib/countryNames";

// Shared by lib/listings.ts and data/import/export-listings-snapshot.ts, so
// the fallback snapshot has exactly the shape the site builds from Postgres.
// Postgres numeric/jsonb columns come back from postgres-js as strings (to
// avoid float-precision loss) and possibly-null respectively — normalize
// both to the shape lib/types.ts's Listing expects everywhere else.
export function rowToListing(row: typeof listingsTable.$inferSelect): Listing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categories: row.categories as Category[],
    status: row.status,
    // Fixes rows imported with a local-language name and no code (see
    // normalizeCountry); the database still holds the raw values.
    ...normalizeCountry(row.country, row.countryCode),
    city: row.city,
    address: row.address,
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    websiteUrl: row.websiteUrl ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    description: row.description ?? undefined,
    coverImageUrl: row.coverImageUrl ?? undefined,
    googleMapsUrl: row.googleMapsUrl ?? undefined,
    instagramUrl: row.instagramUrl ?? undefined,
    facebookUrl: row.facebookUrl ?? undefined,
    tiktokUrl: row.tiktokUrl ?? undefined,
    indoorOutdoor: (row.indoorOutdoor ?? undefined) as IndoorOutdoor | undefined,
    trackLengthM: row.trackLengthM != null ? parseFloat(row.trackLengthM) : undefined,
    openingHours: row.openingHours ?? undefined,
    details: (row.details ?? undefined) as ListingDetails | undefined,
    featured: row.featured,
  };
}
