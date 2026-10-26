import { readFile } from "node:fs/promises";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import type { Category, Listing, ListingDetails, IndoorOutdoor } from "@/lib/types";
import { CALENDAR_EVENTS } from "@/data/calendar-events";
import { PHOTO_CREDITS } from "@/data/photo-credits";
import { db } from "@/lib/db/client";
import { listings as listingsTable } from "@/lib/db/schema";
import { slugifyCountry } from "@/lib/countrySlug";
import { normalizeCountry } from "@/lib/countryNames";

export { slugifyCountry };

// Backed by Postgres (Supabase) via Drizzle — see lib/db/schema.ts and
// data/import/migrate-to-supabase.ts for how the venues got there. Every
// read goes through one cached copy of all published listings (see
// loadPublishedListings below), so page views don't reach the database.
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

// Cover-photo attribution (data/photo-credits.ts) is merged the same way —
// but only while the listing still shows the exact image the credit was
// recorded for, so a replaced photo never inherits someone else's credit.
function withPhotoCredit(listing: Listing): Listing {
  const credit = PHOTO_CREDITS[listing.slug];
  return credit && credit.imageUrl === listing.coverImageUrl ? { ...listing, coverImageCredit: credit } : listing;
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
    details: (row.details ?? undefined) as ListingDetails | undefined,
    featured: row.featured,
  };
}

// ---------------------------------------------------------------------------
// Shared in-memory cache
//
// The whole published directory (~3,500 rows, ~1.5 MB) is loaded with ONE
// query and every function below filters that copy in JS, instead of each
// page view running its own queries. At most one refresh per server instance
// every CACHE_TTL_MS, no matter how many visitors (or dev-server health
// checks) arrive at once:
//  - concurrent callers share the same in-flight query (no stampede)
//  - once stale, callers get the old copy immediately while one background
//    refresh runs (stale-while-revalidate)
//  - if a refresh fails, the old copy keeps serving and it retries later
//  - if there's no old copy either, the bundled snapshot serves instead
//    (see loadSnapshotListings) — the database stays the primary source
// Pages add their own `export const revalidate` on top (ISR), so in
// production most requests don't even reach this code.
//
// Deliberately not unstable_cache / "use cache": Next's data cache skips
// entries over 2 MB, which this list will outgrow as the directory grows.
// Imports show up on the site within CACHE_TTL_MS (or on a server restart).
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 5 * 60 * 1000;
const RETRY_AFTER_ERROR_MS = 30 * 1000;

interface ListingCache {
  listings: Listing[];
  bySlug: Map<string, Listing>;
  expiresAt: number;
}

// Kept on globalThis so every route bundle in the server process shares one
// copy (the dev server can load this module once per route).
const store = ((globalThis as { __raceFinderListings?: { cache: ListingCache | null; inFlight: Promise<ListingCache> | null } })
  .__raceFinderListings ??= { cache: null, inFlight: null });

function toCache(listings: Listing[], ttlMs: number): ListingCache {
  return {
    listings,
    bySlug: new Map(listings.map((l) => [l.slug, l])),
    expiresAt: Date.now() + ttlMs,
  };
}

async function queryPublishedListings(): Promise<ListingCache> {
  if (!db) throw new Error("DATABASE_URL is not set");
  const rows = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.status, "published"))
    .orderBy(asc(listingsTable.name));
  return toCache(rows.map(rowToListing).map(withEvents).map(withPhotoCredit), CACHE_TTL_MS);
}

// Last resort when Postgres is unreachable and this instance has no copy
// yet (cold start, or a build) — e.g. Supabase's free tier pausing the
// project. data/generated-listings.json is the import pipeline's output
// (data/import/import-to-db.ts), so it's the directory as of the last
// import: possibly a few edits behind the database, but far better than a
// 500 on every venue page. It gets the same calendar/photo-credit merge, and
// the short expiry means the database is retried every RETRY_AFTER_ERROR_MS.
// Read at runtime (not imported) for the reason in data/generated-listings.ts;
// next.config.ts's outputFileTracingIncludes ships the file with every route.
async function loadSnapshotListings(): Promise<ListingCache> {
  const raw = await readFile(path.join(process.cwd(), "data", "generated-listings.json"), "utf-8");
  const listings = (JSON.parse(raw) as Listing[])
    .filter((l) => l.status === "published")
    .map((l) => ({ ...l, ...normalizeCountry(l.country, l.countryCode) }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) // approximates the query's ORDER BY name
    .map(withEvents)
    .map(withPhotoCredit);
  return toCache(listings, RETRY_AFTER_ERROR_MS);
}

function refresh(): Promise<ListingCache> {
  store.inFlight ??= queryPublishedListings()
    .then((fresh) => (store.cache = fresh))
    .catch(async (err) => {
      Sentry.captureException(err, { tags: { area: "listings-cache" } });
      if (!store.cache) {
        console.error("Listings query failed with no cached copy; serving the bundled snapshot.", err);
        return (store.cache = await loadSnapshotListings());
      }
      console.error("Listings refresh failed; serving the previous copy.", err);
      store.cache.expiresAt = Date.now() + RETRY_AFTER_ERROR_MS;
      return store.cache;
    })
    .finally(() => {
      store.inFlight = null;
    });
  return store.inFlight;
}

async function loadPublishedListings(): Promise<ListingCache> {
  const { cache } = store;
  if (!cache) return refresh();
  if (Date.now() > cache.expiresAt) void refresh();
  return cache;
}

export interface ListingFilters {
  category?: Category;
  country?: string;
  city?: string;
  indoorOutdoor?: string;
}

// Returned listings are shared across requests — copy before sorting/mutating.
export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  const { listings } = await loadPublishedListings();
  const country = filters.country?.toLowerCase();
  const city = filters.city?.toLowerCase();

  return listings.filter(
    (l) =>
      (!filters.category || l.categories.includes(filters.category)) &&
      (!country || l.country.toLowerCase() === country) &&
      (!city || l.city.toLowerCase() === city) &&
      (!filters.indoorOutdoor || l.indoorOutdoor === filters.indoorOutdoor)
  );
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  const { bySlug } = await loadPublishedListings();
  return bySlug.get(slug);
}

export async function getCountries(): Promise<string[]> {
  const { listings } = await loadPublishedListings();
  return [...new Set(listings.map((l) => l.country))].sort((a, b) => a.localeCompare(b, "en"));
}

// Country name -> ISO code, for pages that only have the name (e.g. the
// /country/[country] route param) and need it to render a flag.
export async function getCountryCode(countryName: string): Promise<string | undefined> {
  const name = countryName.toLowerCase();
  const { listings } = await loadPublishedListings();
  return listings.find((l) => l.country.toLowerCase() === name)?.countryCode;
}

// Same lookup as getCountryCode, but for every country at once — for
// country-select dropdowns (CountryPicker, FilterBar) that want to prefix
// each option with a flag. Returned as a plain object (rather than exporting
// all listings) so client components can take just this small map as a prop
// instead of pulling the full listings dataset into the client bundle.
export async function getCountryCodeMap(): Promise<Record<string, string>> {
  const { listings } = await loadPublishedListings();
  const map: Record<string, string> = {};
  for (const l of listings) map[l.country] = l.countryCode;
  return map;
}
