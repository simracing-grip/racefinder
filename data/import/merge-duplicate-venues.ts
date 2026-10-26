/**
 * Merges venues that are listed twice (same business at the same place,
 * found in the 2026-10-27 dedupe pass) into one listing.
 *
 * For each [keep, drop] pair:
 *  - data/generated-listings.json: fills the kept entry's empty fields from
 *    the dropped one, then removes the dropped entry
 *  - Postgres: fills the kept row's empty fields (including the ones only the
 *    database has — opening hours, social links, track details) from the
 *    dropped row, then archives the dropped row (never deletes)
 *
 * The pairs live in data/merged-venues.ts (also used for redirects). Only
 * pairs confirmed to be the same venue are listed there; ambiguous ones (e.g.
 * two Wohlen tracks 1 km apart with different addresses) are left alone.
 *
 * Run: npx tsx data/import/merge-duplicate-venues.ts [--dry-run]
 * Then: npm run db:snapshot
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import type { Listing } from "../../lib/types";
import { MERGED_VENUES } from "../merged-venues";

const DRY_RUN = process.argv.includes("--dry-run");
const JSON_FILE = path.join(process.cwd(), "data", "generated-listings.json");

const PAIRS = MERGED_VENUES;

// Fields copied onto the kept venue when it has none.
const JSON_FIELDS = [
  "websiteUrl",
  "phone",
  "email",
  "description",
  "coverImageUrl",
  "indoorOutdoor",
  "trackLengthM",
  "details",
] as const satisfies readonly (keyof Listing)[];

const DB_FIELDS = [
  "websiteUrl",
  "phone",
  "email",
  "description",
  "coverImageUrl",
  "instagramUrl",
  "facebookUrl",
  "tiktokUrl",
  "indoorOutdoor",
  "trackLengthM",
  "openingHours",
  "details",
] as const;

const isEmpty = (v: unknown) => v == null || v === "" || (typeof v === "object" && Object.keys(v).length === 0);

function mergeJson(): void {
  const raw = readFileSync(JSON_FILE, "utf-8");
  const listings = JSON.parse(raw) as Listing[];
  const bySlug = new Map(listings.map((l) => [l.slug, l]));
  const dropSlugs = new Set<string>();

  for (const [keepSlug, dropSlug] of PAIRS) {
    const keep = bySlug.get(keepSlug);
    const drop = bySlug.get(dropSlug);
    if (!keep || !drop) {
      console.warn(`JSON: skipping ${keepSlug} <- ${dropSlug} (${!keep ? "keep" : "drop"} not found)`);
      continue;
    }
    const filled = JSON_FIELDS.filter((f) => isEmpty(keep[f]) && !isEmpty(drop[f]));
    for (const f of filled) (keep as unknown as Record<string, unknown>)[f] = drop[f];
    dropSlugs.add(dropSlug);
    console.log(`JSON: ${keepSlug} <- ${dropSlug}${filled.length ? ` (filled ${filled.join(", ")})` : ""}`);
  }

  if (!DRY_RUN) {
    const kept = listings.filter((l) => !dropSlugs.has(l.slug));
    const indent = raw.match(/^\[\n( +)/)?.[1].length ?? 2;
    writeFileSync(JSON_FILE, JSON.stringify(kept, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
  }
  console.log(`JSON: ${DRY_RUN ? "would remove" : "removed"} ${dropSlugs.size} duplicate(s).`);
}

async function mergeDb(): Promise<void> {
  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  const slugs = PAIRS.flat();
  const rows = await db.select().from(listingsTable).where(inArray(listingsTable.slug, slugs));
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  let archived = 0;

  for (const [keepSlug, dropSlug] of PAIRS) {
    const keep = bySlug.get(keepSlug);
    const drop = bySlug.get(dropSlug);
    if (!keep || !drop) {
      console.warn(`DB: skipping ${keepSlug} <- ${dropSlug} (${!keep ? "keep" : "drop"} not found)`);
      continue;
    }
    const set: Record<string, unknown> = {};
    for (const f of DB_FIELDS) if (isEmpty(keep[f]) && !isEmpty(drop[f])) set[f] = drop[f];
    console.log(`DB: ${keepSlug} <- ${dropSlug}${Object.keys(set).length ? ` (filled ${Object.keys(set).join(", ")})` : ""}`);
    if (DRY_RUN) continue;
    if (Object.keys(set).length) await db.update(listingsTable).set(set).where(eq(listingsTable.slug, keepSlug));
    if (drop.status !== "archived") {
      await db.update(listingsTable).set({ status: "archived" }).where(eq(listingsTable.slug, dropSlug));
      archived++;
    }
  }
  console.log(`DB: ${DRY_RUN ? "dry run, nothing written" : `archived ${archived} duplicate(s)`}.`);
}

async function main() {
  mergeJson();
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipped the database step.");
    return;
  }
  await mergeDb();
}

main().then(() => process.exit(0));
