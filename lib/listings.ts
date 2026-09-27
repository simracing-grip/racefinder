import { and, asc, eq, sql } from "drizzle-orm";
import type { Category, Listing, ListingDetails, IndoorOutdoor } from "@/lib/types";
import { CALENDAR_EVENTS } from "@/data/calendar-events";
import { db } from "@/lib/db/client";
import { listings as listingsTable } from "@/lib/db/schema";
import { slugifyCountry } from "@/lib/countrySlug";

export { slugifyCountry };

// Backed by Postgres (Supabase) via Drizzle — see lib/db/schema.ts and
// data/import/migrate-to-supabase.ts for how the ~2,900 venues got there.
// Every exported function here is already async, so this swap from the old
// static generated-listings.ts array was transparent to every caller.
//
// Race-calendar dates (data/calendar-events.ts — also the source for the
// site's /calendar tab) are merged in here in JS by matching listingSlug,
// rather than living in Postgres too, since they're maintained on a much
// faster cadence (a scout agent re-runs) than venue location data and the
// full calendar isn't scoped to our listings anyway (MotoGP/IMSA/WEC race
// well outside them).
function withEvents(listing: Listing): Listing {
  const events = CALENDAR_EVENTS.filter((e) => e.listingSlug === listing.slug);
  return events.length > 0 ? { ...listing, events } : listing;
}

// Postgres numeric/jsonb columns come back from postgres-js as strings (to
// avoid float-precision loss) and possibly-null respectively — normalize
// both to the shape lib/types.ts's Listing expects everywhere else.
function rowToListing(row: typeof listingsTable.$inferSelect): Listing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categories: row.categories as Category[],
    status: row.status,
    country: row.country,
    countryCode: row.countryCode,
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
    indoorOutdoor: (row.indoorOutdoor ?? undefined) as IndoorOutdoor | undefined,
    trackLengthM: row.trackLengthM != null ? parseFloat(row.trackLengthM) : undefined,
    details: (row.details ?? undefined) as ListingDetails | undefined,
    featured: row.featured,
  };
}

export interface ListingFilters {
  category?: Category;
  country?: string;
  city?: string;
  indoorOutdoor?: string;
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  const conditions = [eq(listingsTable.status, "published")];

  if (filters.category) {
    // categories is a Postgres text[]; @> is the "array contains" operator.
    conditions.push(sql`${listingsTable.categories} @> ARRAY[${filters.category}]::text[]`);
  }
  if (filters.country) {
    conditions.push(sql`lower(${listingsTable.country}) = lower(${filters.country})`);
  }
  if (filters.city) {
    conditions.push(sql`lower(${listingsTable.city}) = lower(${filters.city})`);
  }
  if (filters.indoorOutdoor) {
    conditions.push(eq(listingsTable.indoorOutdoor, filters.indoorOutdoor as IndoorOutdoor));
  }

  const rows = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(asc(listingsTable.name));

  return rows.map(rowToListing).map(withEvents);
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const rows = await db
    .select()
    .from(listingsTable)
    .where(and(eq(listingsTable.slug, slug), eq(listingsTable.status, "published")))
    .limit(1);

  const row = rows[0];
  return row ? withEvents(rowToListing(row)) : undefined;
}

export async function getCountries(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ country: listingsTable.country })
    .from(listingsTable)
    .where(eq(listingsTable.status, "published"))
    .orderBy(asc(listingsTable.country));
  return rows.map((r) => r.country);
}

// Country name -> ISO code, for pages that only have the name (e.g. the
// /country/[country] route param) and need it to render a flag.
export async function getCountryCode(countryName: string): Promise<string | undefined> {
  const rows = await db
    .select({ countryCode: listingsTable.countryCode })
    .from(listingsTable)
    .where(sql`lower(${listingsTable.country}) = lower(${countryName})`)
    .limit(1);
  return rows[0]?.countryCode;
}

// Same lookup as getCountryCode, but for every country at once — for
// country-select dropdowns (CountryPicker, FilterBar) that want to prefix
// each option with a flag. Returned as a plain object (rather than exporting
// all listings) so client components can take just this small map as a prop
// instead of pulling the full listings dataset into the client bundle.
export async function getCountryCodeMap(): Promise<Record<string, string>> {
  const rows = await db
    .selectDistinct({ country: listingsTable.country, countryCode: listingsTable.countryCode })
    .from(listingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.country] = r.countryCode;
  return map;
}
