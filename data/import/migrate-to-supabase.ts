/**
 * One-time bulk load: pushes every listing currently in
 * data/generated-listings.ts into the Postgres `listings` table.
 *
 * Unlike data/import/import-to-db.ts (which upserts from a fresh
 * review.csv batch), this reads the full, already-accumulated dataset —
 * the right source now that the site is switching from serving
 * generated-listings.ts directly to querying Postgres instead.
 *
 * Run once, after `npm run db:generate && npm run db:migrate`:
 *   npx tsx data/import/migrate-to-supabase.ts
 *
 * Safe to re-run: existing rows (matched by slug) are left untouched.
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
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
    console.log("DATABASE_URL not set — fill in .env first (see README's Supabase section).");
    return;
  }

  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  console.log(`Loading ${generatedListings.length} listings into Postgres in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  for (const batch of chunk(generatedListings, BATCH_SIZE)) {
    const rows = batch.map(toRow);
    const result = await db
      .insert(listingsTable)
      .values(rows)
      .onConflictDoNothing({ target: listingsTable.slug })
      .returning({ slug: listingsTable.slug });
    inserted += result.length;
    process.stdout.write(`.`);
  }

  console.log(`\nDone. ${inserted} new row(s) inserted (existing slugs were left untouched).`);

  const [{ count }] = await db.execute<{ count: string }>(sql`select count(*)::text as count from listings`);
  console.log(`Total rows now in Postgres: ${count}`);
}

main().then(() => process.exit(0));
