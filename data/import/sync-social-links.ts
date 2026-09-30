/**
 * Applies data/import/social-links.csv (slug,instagramUrl,facebookUrl,
 * tiktokUrl,source — written by the venue-social-finder agent) straight to
 * Postgres, by slug.
 *
 * Deliberately separate from sync-to-supabase.ts, which reconciles the *full*
 * listing set from data/generated-listings.ts and archives any published row
 * missing from that snapshot — running it here would risk archiving venues
 * that simply aren't in generated-listings.ts's last regeneration. This
 * script only ever touches the three social-link columns, only for slugs
 * that exist in the CSV, and never inserts, deletes, or archives a row.
 *
 * Run: npx tsx data/import/sync-social-links.ts
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";

const SOCIAL_LINKS_FILE = path.join(process.cwd(), "data", "import", "social-links.csv");

interface SocialLinkRow {
  slug: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  source?: string;
}

function isHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set.");
    return;
  }
  if (!existsSync(SOCIAL_LINKS_FILE)) {
    console.log(`${SOCIAL_LINKS_FILE} not found.`);
    return;
  }

  const content = readFileSync(SOCIAL_LINKS_FILE, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as SocialLinkRow[];

  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");

  let updated = 0;
  let skippedNoMatch = 0;
  let skippedInvalidUrl = 0;

  for (const row of rows) {
    if (!row.slug) continue;

    const set: Record<string, string> = {};
    for (const [col, key] of [
      ["instagramUrl", "instagramUrl"],
      ["facebookUrl", "facebookUrl"],
      ["tiktokUrl", "tiktokUrl"],
    ] as const) {
      const value = row[key];
      if (!value) continue;
      if (!isHttpUrl(value)) {
        console.warn(`Skipping invalid ${key} for ${row.slug}: ${value}`);
        skippedInvalidUrl++;
        continue;
      }
      set[col] = value;
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
  if (skippedInvalidUrl > 0) console.log(`${skippedInvalidUrl} URL(s) were invalid and skipped.`);
}

main().then(() => process.exit(0));
