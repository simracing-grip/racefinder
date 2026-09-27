/**
 * Reconciles Postgres with the current data/generated-listings.ts, which is
 * regenerated from data/import/review.csv on every import:load run (parsing,
 * verification, and pruning of unconfirmed/closed venues happen upstream of
 * this script — see data/import/import-to-db.ts and the venue-verifier
 * agent).
 *
 * Unlike migrate-to-supabase.ts (a one-shot insert-only seed), this:
 *  - upserts every listing in generatedListings by slug (insert new, update
 *    changed fields on existing rows)
 *  - archives (status = "archived", not deleted) any published row whose
 *    slug no longer appears in generatedListings — i.e. venues the
 *    verifier/reviewer dropped since the last sync
 *
 * Run after every import:load / verification pass:
 *   npx tsx data/import/sync-to-supabase.ts
 */
import "dotenv/config";
import { and, ne, notInArray, sql } from "drizzle-orm";
import { generatedListings } from "../generated-listings";
import type { Listing } from "../../lib/types";

const BATCH_SIZE = 250;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function toRow(listing: Listing) {
  return {
    slug: listing.slug,
    name: listing.name,
    categories: listing.categories,
    status: listing.status,
    country: listing.country,
    countryCode: listing.countryCode,
    city: listing.city,
    address: listing.address,
    lat: String(listing.lat),
    lng: String(listing.lng),
    websiteUrl: listing.websiteUrl ?? null,
    phone: listing.phone ?? null,
    email: listing.email ?? null,
    description: listing.description ?? null,
    coverImageUrl: listing.coverImageUrl ?? null,
    googleMapsUrl: listing.googleMapsUrl ?? null,
    indoorOutdoor: listing.indoorOutdoor ?? null,
    trackLengthM: listing.trackLengthM != null ? String(listing.trackLengthM) : null,
    details: listing.details ?? null,
    featured: listing.featured ?? false,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set.");
    return;
  }

  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  const currentSlugs = generatedListings.map((l) => l.slug);
  console.log(`Syncing ${currentSlugs.length} listings from generated-listings.ts...`);

  let upserted = 0;
  for (const batch of chunk(generatedListings, BATCH_SIZE)) {
    const rows = batch.map(toRow);
    await db
      .insert(listingsTable)
      .values(rows)
      .onConflictDoUpdate({
        target: listingsTable.slug,
        set: {
          name: sql`excluded.name`,
          categories: sql`excluded.categories`,
          status: sql`excluded.status`,
          country: sql`excluded.country`,
          countryCode: sql`excluded.country_code`,
          city: sql`excluded.city`,
          address: sql`excluded.address`,
          lat: sql`excluded.lat`,
          lng: sql`excluded.lng`,
          websiteUrl: sql`excluded.website_url`,
          phone: sql`excluded.phone`,
          email: sql`excluded.email`,
          description: sql`excluded.description`,
          coverImageUrl: sql`excluded.cover_image_url`,
          googleMapsUrl: sql`excluded.google_maps_url`,
          indoorOutdoor: sql`excluded.indoor_outdoor`,
          trackLengthM: sql`excluded.track_length_m`,
          details: sql`excluded.details`,
          featured: sql`excluded.featured`,
        },
      });
    upserted += rows.length;
    process.stdout.write(".");
  }
  console.log(`\nUpserted ${upserted} row(s).`);

  const archived = await db
    .update(listingsTable)
    .set({ status: "archived" })
    .where(and(ne(listingsTable.status, "archived"), notInArray(listingsTable.slug, currentSlugs)))
    .returning({ slug: listingsTable.slug, name: listingsTable.name });
  console.log(`Archived ${archived.length} row(s) no longer in generated-listings.ts:`);
  for (const row of archived) console.log(`  - ${row.name} (${row.slug})`);

  const [{ count }] = await db.execute<{ count: string }>(
    sql`select count(*)::text as count from listings where status = 'published'`
  );
  console.log(`Total published rows in Postgres: ${count}`);
}

main().then(() => process.exit(0));
