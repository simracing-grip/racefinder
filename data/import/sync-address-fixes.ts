/**
 * Applies data/import/address-fixes.csv (written by find-poi-addresses.ts):
 * replaces a venue's address with the cleaned one, which drops the name of an
 * unrelated nearby place from the front.
 *
 * A fix applies only while the venue's pin is still where it was when the fix
 * was made (same lat/lng) and its address is still the old one, so a venue
 * that has been moved or corrected since is left alone.
 *
 * Updates both data/generated-listings.json and Postgres, and only ever
 * touches the address column (see sync-location-fixes.ts for why these syncs
 * are kept narrow). import-to-db.ts reads the same CSV, so a later re-import
 * from review.csv keeps the clean addresses.
 *
 * Run: npx tsx data/import/sync-address-fixes.ts [--dry-run]
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import type { Listing } from "../../lib/types";

const ADDRESS_FIXES_FILE = path.join(process.cwd(), "data", "import", "address-fixes.csv");
const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const BATCH_SIZE = 250;
const DRY_RUN = process.argv.includes("--dry-run");

export interface AddressFixRow {
  slug: string;
  lat: string;
  lng: string;
  oldAddress: string;
  address: string;
}

export function loadAddressFixes(): Map<string, AddressFixRow> {
  const bySlug = new Map<string, AddressFixRow>();
  if (!existsSync(ADDRESS_FIXES_FILE)) return bySlug;
  const rows = parse(readFileSync(ADDRESS_FIXES_FILE, "utf-8"), { columns: true, skip_empty_lines: true }) as AddressFixRow[];
  for (const row of rows) if (row.slug && row.address) bySlug.set(row.slug, row);
  return bySlug;
}

/** The fixed address, if this fix still applies to the venue as it is now. */
export function fixedAddress(
  fix: AddressFixRow | undefined,
  venue: { lat: number | string; lng: number | string; address: string }
): string | undefined {
  if (!fix) return undefined;
  const samePin =
    Math.abs(Number(venue.lat) - parseFloat(fix.lat)) < 1e-6 && Math.abs(Number(venue.lng) - parseFloat(fix.lng)) < 1e-6;
  return samePin && venue.address === fix.oldAddress ? fix.address : undefined;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  const fixes = loadAddressFixes();
  if (fixes.size === 0) {
    console.log(`${ADDRESS_FIXES_FILE} not found or empty.`);
    return;
  }

  const generated: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const applied: { slug: string; lat: number; lng: number; oldAddress: string; address: string }[] = [];
  const updated = generated.map((l) => {
    const address = fixedAddress(fixes.get(l.slug), l);
    if (!address) return l;
    applied.push({ slug: l.slug, lat: l.lat, lng: l.lng, oldAddress: l.address, address });
    return { ...l, address };
  });
  const stale = fixes.size - applied.length;
  console.log(`${applied.length} of ${fixes.size} fixes apply${stale ? ` (${stale} skipped: venue moved, changed or gone)` : ""}${DRY_RUN ? " (dry run)" : ""}.`);
  if (!DRY_RUN) writeFileSync(GENERATED_FILE, JSON.stringify(updated, null, 2) + "\n");

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipped the database.");
    return;
  }
  const { db } = await import("../../lib/db/client");

  // Same guard as above, in SQL: only rows whose pin and address are unchanged.
  let changed = 0;
  for (const batch of chunk(applied, BATCH_SIZE)) {
    if (DRY_RUN) {
      changed += batch.length;
      continue;
    }
    const values = sql.join(
      batch.map((r) => sql`(${r.slug}, ${r.lat}::numeric, ${r.lng}::numeric, ${r.oldAddress}, ${r.address})`),
      sql`, `
    );
    const result = await db.execute<{ slug: string }>(sql`
      update listings as l set
        address = v.address,
        updated_at = now()
      from (values ${values}) as v(slug, lat, lng, old_address, address)
      where l.slug = v.slug
        and abs(l.lat - v.lat) < 0.000001
        and abs(l.lng - v.lng) < 0.000001
        and l.address = v.old_address
      returning l.slug`);
    changed += result.length;
    process.stdout.write(".");
  }
  console.log(`\n${DRY_RUN ? "Would update" : "Updated"} ${changed} address(es) in Postgres.`);
  process.exit(0);
}

// Only when run directly, not when import-to-db.ts imports the loader.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("sync-address-fixes.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
