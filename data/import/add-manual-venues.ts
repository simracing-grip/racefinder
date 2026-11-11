/**
 * Adds venues found by hand, or restores archived ones, in Postgres and
 * data/generated-listings.json.
 *
 * import-to-db.ts can't be used for this: generated-listings.json has been
 * edited by many sync scripts since review.csv was last imported, so a full
 * re-import no longer reproduces it.
 *
 * Input is a JSON array of venues keyed by slug:
 *  - slug not in the database: inserted. Needs every required Listing field
 *    (validated with listingSchema).
 *  - slug archived: restored to published. Only the fields given are
 *    changed; the rest of the archived row (track details, hours) is kept.
 *  - slug already published: skipped.
 * The resulting rows are then read back and appended to
 * generated-listings.json, in the same shape the snapshot uses.
 *
 * If a restored venue was archived by a location-fixes.csv "drop" row, also
 * add a "fix" row for it there, or a later re-import drops it again.
 *
 * Run: npx tsx data/import/add-manual-venues.ts --file data/import/manual-venues-2026-11-11.json [--dry-run]
 * Then: npm run db:snapshot
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import "dotenv/config";
import { inArray } from "drizzle-orm";
import { listingSchema } from "../../lib/validation/listing";
import type { Listing } from "../../lib/types";

const OUT_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const DRY_RUN = process.argv.includes("--dry-run");

function columns(v: Partial<Listing>) {
  const c = {
    name: v.name,
    categories: v.categories,
    country: v.country,
    countryCode: v.countryCode,
    city: v.city,
    address: v.address,
    lat: v.lat !== undefined ? String(v.lat) : undefined,
    lng: v.lng !== undefined ? String(v.lng) : undefined,
    websiteUrl: v.websiteUrl,
    phone: v.phone,
    description: v.description,
    coverImageUrl: v.coverImageUrl,
    googleMapsUrl: v.googleMapsUrl,
    indoorOutdoor: v.indoorOutdoor,
    trackLengthM: v.trackLengthM !== undefined ? String(v.trackLengthM) : undefined,
    openingHours: v.openingHours,
    details: v.details,
  };
  return Object.fromEntries(Object.entries(c).filter(([, value]) => value !== undefined));
}

async function main() {
  const fileArg = process.argv.indexOf("--file");
  if (fileArg === -1 || !process.argv[fileArg + 1]) {
    console.log("Usage: npx tsx data/import/add-manual-venues.ts --file <venues.json> [--dry-run]");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set.");
    process.exit(1);
  }
  const input = JSON.parse(readFileSync(path.resolve(process.argv[fileArg + 1]), "utf-8")) as Partial<Listing>[];
  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");
  const { rowToListing } = await import("../../lib/db/rowToListing");

  const slugs = input.map((v) => v.slug).filter((s): s is string => !!s);
  const existing = new Map(
    (await db.select().from(listingsTable).where(inArray(listingsTable.slug, slugs))).map((r) => [r.slug, r])
  );

  const done: string[] = [];
  for (const venue of input) {
    const row = existing.get(venue.slug ?? "");
    if (row?.status === "published") {
      console.log(`Skipping ${venue.slug}: already published.`);
      continue;
    }
    if (row) {
      const result = listingSchema.partial().safeParse(venue);
      if (!result.success) throw new Error(`${venue.slug}: ${result.error.message}`);
      console.log(`Restoring ${venue.slug} (was ${row.status}): ${Object.keys(columns(result.data)).join(", ")}`);
      if (!DRY_RUN) {
        await db
          .update(listingsTable)
          .set({ ...columns(result.data), status: "published", updatedAt: new Date() })
          .where(inArray(listingsTable.slug, [row.slug]));
      }
    } else {
      const result = listingSchema.safeParse(venue);
      if (!result.success) throw new Error(`${venue.slug}: ${result.error.message}`);
      console.log(`Adding ${venue.slug}`);
      if (!DRY_RUN) {
        await db.insert(listingsTable).values({ slug: result.data.slug, status: "published", ...columns(result.data) } as typeof listingsTable.$inferInsert);
      }
    }
    done.push(venue.slug!);
  }
  if (done.length === 0 || DRY_RUN) {
    console.log(DRY_RUN ? "Dry run: nothing written." : "Nothing to add.");
    return;
  }

  const listings = JSON.parse(readFileSync(OUT_FILE, "utf-8")) as Listing[];
  const inJson = new Set(listings.map((l) => l.slug));
  let nextId = Math.max(...listings.map((l) => Number(l.id) || 0)) + 1;
  const rows = await db.select().from(listingsTable).where(inArray(listingsTable.slug, done));
  for (const row of rows) {
    if (inJson.has(row.slug)) continue;
    const { featured: _featured, ...listing } = rowToListing(row);
    listings.push({ ...listing, id: String(nextId++) });
  }
  writeFileSync(OUT_FILE, JSON.stringify(listings, null, 2) + "\n");
  console.log(`Published ${done.length} venue(s): ${done.join(", ")}. Now run npm run db:snapshot.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
