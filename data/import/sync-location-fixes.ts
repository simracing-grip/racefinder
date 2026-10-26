/**
 * Applies data/import/location-fixes.csv (slug,action,lat,lng,address,city,
 * source,evidence,... — written by relocate-approximate-venues.ts):
 *  - action=fix:  new lat/lng/address/city
 *  - action=drop: venue couldn't be located confidently — archived (status
 *    = "archived", not deleted) and removed from generated-listings.json
 *  - action=keep: pin verified as-is, nothing to do
 *
 * Updates both data/generated-listings.json and Postgres. Deliberately
 * separate from sync-to-supabase.ts (see sync-social-links.ts for why): it
 * only ever touches lat, lng, address, city and status, only for slugs in
 * the CSV. Database writes go out as one statement per BATCH_SIZE rows —
 * per-row loops have overloaded the Supabase instance before.
 *
 * import-to-db.ts reads the same CSV, so a later re-import from review.csv
 * doesn't bring the old centroid pins back.
 *
 * Run: npx tsx data/import/sync-location-fixes.ts [--dry-run]
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { and, inArray, ne, sql } from "drizzle-orm";
import type { Listing } from "../../lib/types";

const LOCATION_FIXES_FILE = path.join(process.cwd(), "data", "import", "location-fixes.csv");
const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const BATCH_SIZE = 250;
const DRY_RUN = process.argv.includes("--dry-run");

export interface LocationFixRow {
  slug: string;
  action: "fix" | "drop" | "keep";
  lat: string;
  lng: string;
  address: string;
  city: string;
  source?: string;
  evidence?: string;
  name?: string;
}

export function loadLocationFixes(): Map<string, LocationFixRow> {
  const bySlug = new Map<string, LocationFixRow>();
  if (!existsSync(LOCATION_FIXES_FILE)) return bySlug;
  const rows = parse(readFileSync(LOCATION_FIXES_FILE, "utf-8"), { columns: true, skip_empty_lines: true }) as LocationFixRow[];
  for (const row of rows) {
    if (!row.slug) continue;
    if (row.action === "fix" && !(Number.isFinite(parseFloat(row.lat)) && Number.isFinite(parseFloat(row.lng)))) {
      console.warn(`Ignoring fix for ${row.slug}: missing coordinates`);
      continue;
    }
    bySlug.set(row.slug, row);
  }
  return bySlug;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const fixes = loadLocationFixes();
  if (fixes.size === 0) {
    console.log(`${LOCATION_FIXES_FILE} not found or empty.`);
    return;
  }
  const toFix = [...fixes.values()].filter((r) => r.action === "fix");
  const toDrop = [...fixes.values()].filter((r) => r.action === "drop");
  console.log(`${toFix.length} to move, ${toDrop.length} to drop${DRY_RUN ? " (dry run)" : ""}.`);

  // generated-listings.json
  const generated: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const dropSlugs = new Set(toDrop.map((r) => r.slug));
  let moved = 0;
  const kept = generated
    .filter((l) => !dropSlugs.has(l.slug))
    .map((l) => {
      const fix = fixes.get(l.slug);
      if (fix?.action !== "fix") return l;
      moved++;
      return {
        ...l,
        lat: parseFloat(fix.lat),
        lng: parseFloat(fix.lng),
        address: fix.address || l.address,
        city: fix.city || l.city,
      };
    });
  console.log(`generated-listings.json: ${generated.length} -> ${kept.length} listings, ${moved} moved.`);
  if (!DRY_RUN) writeFileSync(GENERATED_FILE, JSON.stringify(kept, null, 2) + "\n");

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipped the database.");
    return;
  }
  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  let updated = 0;
  for (const batch of chunk(toFix, BATCH_SIZE)) {
    const values = sql.join(
      batch.map((r) => sql`(${r.slug}, ${r.lat}::numeric, ${r.lng}::numeric, ${r.address || null}, ${r.city || null})`),
      sql`, `
    );
    const query = sql`
      update listings as l set
        lat = v.lat,
        lng = v.lng,
        address = coalesce(v.address, l.address),
        city = coalesce(v.city, l.city),
        updated_at = now()
      from (values ${values}) as v(slug, lat, lng, address, city)
      where l.slug = v.slug
      returning l.slug`;
    if (DRY_RUN) {
      updated += batch.length;
      continue;
    }
    const result = await db.execute<{ slug: string }>(query);
    updated += result.length;
    process.stdout.write(".");
  }
  console.log(`\nMoved ${updated} row(s) in Postgres.`);

  let archived = 0;
  for (const batch of chunk(toDrop.map((r) => r.slug), BATCH_SIZE)) {
    if (DRY_RUN) {
      archived += batch.length;
      continue;
    }
    const result = await db
      .update(listingsTable)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(inArray(listingsTable.slug, batch), ne(listingsTable.status, "archived")))
      .returning({ slug: listingsTable.slug });
    archived += result.length;
  }
  console.log(`Archived ${archived} row(s) in Postgres.`);

  const [{ count }] = await db.execute<{ count: string }>(
    sql`select count(*)::text as count from listings where status = 'published'`
  );
  console.log(`Total published rows in Postgres: ${count}`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("sync-location-fixes.ts")) {
  main().then(() => process.exit(0));
}
