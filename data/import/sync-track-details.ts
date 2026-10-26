/**
 * Applies data/import/track-details*.csv — the main file plus the regional
 * passes (track-details-cee.csv, -dach2, -iberia, ...) — (slug,indoorOutdoor,trackLengthM,
 * kartType,maxKartSpeedKmh,minAgeOrHeight,openingHours,source — written by
 * the kart-map-scout agent's detail-enrichment pass) straight to Postgres,
 * by slug.
 *
 * Deliberately separate from sync-to-supabase.ts (see that file's comment)
 * — this only ever touches indoor_outdoor, track_length_m, opening_hours,
 * and merges into (never replaces) the existing details.karting jsonb, only
 * for slugs that exist in the CSV. Never inserts, deletes, or archives a row.
 *
 * When a slug appears in more than one file, each field takes the first
 * non-empty value, reading track-details.csv first and the regional files
 * in name order.
 *
 * Run: npx tsx data/import/sync-track-details.ts [--dry-run]
 */
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

const IMPORT_DIR = path.join(process.cwd(), "data", "import");
const DRY_RUN = process.argv.includes("--dry-run");

// track-details.csv first, then the regional files alphabetically.
function trackDetailFiles(): string[] {
  return readdirSync(IMPORT_DIR)
    .filter((f) => /^track-details(-[\w-]+)?\.csv$/.test(f))
    .sort((a, b) => (a === "track-details.csv" ? -1 : b === "track-details.csv" ? 1 : a.localeCompare(b)))
    .map((f) => path.join(IMPORT_DIR, f));
}

// One row per slug; earlier files win field by field.
function loadRows(files: string[]): TrackDetailRow[] {
  const bySlug = new Map<string, TrackDetailRow>();
  for (const file of files) {
    const rows = parse(readFileSync(file, "utf-8"), { columns: true, skip_empty_lines: true }) as TrackDetailRow[];
    console.log(`${path.basename(file)}: ${rows.length} row(s)`);
    for (const row of rows) {
      if (!row.slug) continue;
      const merged = bySlug.get(row.slug) ?? { slug: row.slug };
      for (const [key, value] of Object.entries(row) as [keyof TrackDetailRow, string | undefined][]) {
        if (value && !merged[key]) merged[key] = value;
      }
      bySlug.set(row.slug, merged);
    }
  }
  return [...bySlug.values()];
}

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
  const files = trackDetailFiles();
  if (files.length === 0) {
    console.log(`No track-details*.csv found in ${IMPORT_DIR}.`);
    return;
  }
  const rows = loadRows(files);
  console.log(`${rows.length} unique slug(s) across ${files.length} file(s)${DRY_RUN ? " — dry run, nothing is written" : ""}.`);

  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  let updated = 0;
  let skippedNoMatch = 0;
  const fieldCounts: Record<string, number> = {};

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

    const result = DRY_RUN
      ? await db
          .select({ slug: listingsTable.slug })
          .from(listingsTable)
          .where(eq(listingsTable.slug, row.slug))
      : await db
          .update(listingsTable)
          .set(set)
          .where(eq(listingsTable.slug, row.slug))
          .returning({ slug: listingsTable.slug });
    if (result.length > 0) for (const key of Object.keys(set)) fieldCounts[key] = (fieldCounts[key] ?? 0) + 1;

    if (result.length === 0) {
      console.warn(`No listing found for slug: ${row.slug}`);
      skippedNoMatch++;
    } else {
      updated++;
    }
  }

  console.log(`${DRY_RUN ? "Would update" : "Updated"} ${updated} listing(s). Fields set:`, fieldCounts);
  if (skippedNoMatch > 0) console.log(`${skippedNoMatch} slug(s) had no matching listing.`);
}

main().then(() => process.exit(0));
