/**
 * Applies data/import/website-fixes.csv (slug,oldWebsiteUrl,websiteUrl,source):
 * replaces a venue's website with a corrected one, or removes it when the new
 * value is empty (a dead link with no replacement).
 *
 * A fix applies only while the venue still has the old value, so a website
 * corrected some other way since is left alone. Only the website_url column
 * is touched (see sync-location-fixes.ts for why these syncs are narrow), and
 * import-to-db.ts applies the same file on every import.
 *
 * Run: npx tsx data/import/sync-website-fixes.ts [--dry-run]
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { sql } from "drizzle-orm";
import type { Listing } from "../../lib/types";

const WEBSITE_FIXES_FILE = path.join(process.cwd(), "data", "import", "website-fixes.csv");
const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const DRY_RUN = process.argv.includes("--dry-run");

export interface WebsiteFixRow {
  slug: string;
  oldWebsiteUrl: string;
  websiteUrl: string;
}

export function loadWebsiteFixes(): Map<string, WebsiteFixRow> {
  const bySlug = new Map<string, WebsiteFixRow>();
  if (!existsSync(WEBSITE_FIXES_FILE)) return bySlug;
  const rows = parse(readFileSync(WEBSITE_FIXES_FILE, "utf-8"), { columns: true, skip_empty_lines: true }) as WebsiteFixRow[];
  for (const row of rows) if (row.slug) bySlug.set(row.slug, row);
  return bySlug;
}

/** The corrected website ("" = none), if this fix still applies; else undefined. */
export function fixedWebsite(fix: WebsiteFixRow | undefined, current: string | undefined): string | undefined {
  if (!fix) return undefined;
  return (current ?? "") === (fix.oldWebsiteUrl ?? "") ? fix.websiteUrl : undefined;
}

async function main() {
  const fixes = loadWebsiteFixes();
  if (fixes.size === 0) {
    console.log(`${WEBSITE_FIXES_FILE} not found or empty.`);
    return;
  }
  const generated: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const applied: { slug: string; old: string; next: string }[] = [];
  const updated = generated.map((l) => {
    const next = fixedWebsite(fixes.get(l.slug), l.websiteUrl);
    if (next === undefined) return l;
    applied.push({ slug: l.slug, old: l.websiteUrl ?? "", next });
    const out = { ...l, websiteUrl: next || undefined };
    if (!next) delete out.websiteUrl;
    return out;
  });
  console.log(`${applied.length} of ${fixes.size} website fixes apply${DRY_RUN ? " (dry run)" : ""}.`);
  if (!DRY_RUN) writeFileSync(GENERATED_FILE, JSON.stringify(updated, null, 2) + "\n");

  if (!process.env.DATABASE_URL || applied.length === 0) {
    if (!process.env.DATABASE_URL) console.log("DATABASE_URL not set — skipped the database.");
    return;
  }
  const { db } = await import("../../lib/db/client");
  if (!db) return;
  if (DRY_RUN) {
    console.log(`Would update ${applied.length} website(s) in Postgres.`);
    return;
  }
  const values = sql.join(
    applied.map((r) => sql`(${r.slug}, ${r.old}, ${r.next})`),
    sql`, `
  );
  const result = await db.execute<{ slug: string }>(sql`
    update listings as l set
      website_url = nullif(v.next, ''),
      updated_at = now()
    from (values ${values}) as v(slug, old, next)
    where l.slug = v.slug and coalesce(l.website_url, '') = v.old
    returning l.slug`);
  console.log(`Updated ${result.length} website(s) in Postgres.`);
}

// Only when run directly, not when import-to-db.ts imports the loader.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("sync-website-fixes.ts")) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
