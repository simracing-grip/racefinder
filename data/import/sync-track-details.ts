/**
 * Applies data/import/track-details.csv (slug,indoorOutdoor,trackLengthM,
 * kartType,maxKartSpeedKmh,minAgeOrHeight,openingHours,source — written by
 * the kart-map-scout agent's detail-enrichment pass) straight to Postgres,
 * by slug.
 *
 * Deliberately separate from sync-to-supabase.ts (see that file's comment)
 * — this only ever touches indoor_outdoor, track_length_m, opening_hours,
 * and merges into (never replaces) the existing details.karting jsonb, only
 * for slugs that exist in the CSV. Never inserts, deletes, or archives a row.
 *
 * Run: npx tsx data/import/sync-track-details.ts
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

const TRACK_DETAILS_FILE = path.join(process.cwd(), "data", "import", "track-details.csv");

interface TrackDetailRow {
  slug: string;
  indoorOutdoor?: string;
  trackLengthM?: string;
  kartType?: string;
  maxKartSpeedKmh?: string;
  minAgeOrHeight?: string;
  openingHours?: string;
  source?: string;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set.");
    return;
  }
  if (!existsSync(TRACK_DETAILS_FILE)) {
    console.log(`${TRACK_DETAILS_FILE} not found.`);
    return;
  }

  const content = readFileSync(TRACK_DETAILS_FILE, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as TrackDetailRow[];

  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  let updated = 0;
  let skippedNoMatch = 0;

  for (const row of rows) {
    if (!row.slug) continue;

    const set: Record<string, unknown> = {};
    if (row.indoorOutdoor && ["indoor", "outdoor", "both"].includes(row.indoorOutdoor)) {
      set.indoorOutdoor = row.indoorOutdoor;
    }
    if (row.trackLengthM) set.trackLengthM = row.trackLengthM;
    if (row.openingHours) set.openingHours = row.openingHours;

    const karting: Record<string, unknown> = {};
    if (row.kartType && ["petrol", "electric", "both"].includes(row.kartType)) karting.kart_type = row.kartType;
    if (row.maxKartSpeedKmh) karting.max_kart_speed_kmh = Number(row.maxKartSpeedKmh);
    if (row.minAgeOrHeight) karting.min_age_or_height = row.minAgeOrHeight;

    if (Object.keys(karting).length > 0) {
      // Merge into whatever `details` jsonb already has rather than
      // clobbering other categories' data on the same row.
      const [existing] = await db
        .select({ details: listingsTable.details })
        .from(listingsTable)
        .where(eq(listingsTable.slug, row.slug))
        .limit(1);
      const existingDetails = (existing?.details as Record<string, unknown>) ?? {};
      set.details = { ...existingDetails, karting: { ...(existingDetails.karting as object), ...karting } };
    }

    if (Object.keys(set).length === 0) continue;

    const result = await db
      .update(listingsTable)
      .set(set)
      .where(eq(listingsTable.slug, row.slug))
      .returning({ slug: listingsTable.slug });

    if (result.length === 0) {
      console.warn(`No listing found for slug: ${row.slug}`);
      skippedNoMatch++;
    } else {
      updated++;
    }
  }

  console.log(`Updated ${updated} listing(s).`);
  if (skippedNoMatch > 0) console.log(`${skippedNoMatch} slug(s) had no matching listing.`);
}

main().then(() => process.exit(0));
