/**
 * Applies the licensed circuit photo run (data/import/photos/batches/
 * batch-*.csv, written by the venue-photo-finder agent) to the site.
 *
 * For every published venue with a verified photoIndex-1 photo:
 *  - no cover photo yet, or one from a non-licensed source (a venue or
 *    tourism site, TripAdvisor...) → the licensed Commons photo replaces it
 *  - already a Wikimedia Commons photo → left alone (it has its own credit)
 *
 * Writes the new coverImageUrl into data/generated-listings.json and the
 * matching author/license row into data/import/cover-images.csv, so
 * `npm run import:sync-credits` regenerates data/photo-credits.ts with the
 * attribution CC BY/BY-SA require. Postgres picks the URL up on the next
 * `npx tsx data/import/sync-to-supabase.ts`. photoIndex-2+ rows are kept in
 * the batch files for a future gallery.
 *
 * Run: npx tsx data/import/apply-photo-run.ts [--dry-run]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import type { Listing } from "../../lib/types";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = process.cwd();
const BATCH_DIR = path.join(ROOT, "data", "import", "photos", "batches");
const JSON_FILE = path.join(ROOT, "data", "generated-listings.json");
const COVER_CSV = path.join(ROOT, "data", "import", "cover-images.csv");

interface PhotoRow {
  slug: string;
  photoIndex: string;
  imageUrl: string;
  sourcePageUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  verified: string;
}

interface CoverRow {
  slug: string;
  coverImageUrl: string;
  source: string;
  sourcePageUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
}

const isCommons = (url: string | undefined) => !!url && /(^|\.)wikimedia\.org$/.test(new URL(url).hostname);

function loadVerifiedPhotos(): Map<string, PhotoRow> {
  const best = new Map<string, PhotoRow>();
  const files = readdirSync(BATCH_DIR).filter((f) => /^batch-\d+\.csv$/.test(f));
  for (const file of files) {
    const rows = parse(readFileSync(path.join(BATCH_DIR, file), "utf-8"), {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    }) as PhotoRow[];
    for (const row of rows) {
      if (row.verified !== "yes" || row.photoIndex !== "1" || !row.imageUrl || !row.license) continue;
      if (!best.has(row.slug)) best.set(row.slug, row);
    }
  }
  return best;
}

function main() {
  const photos = loadVerifiedPhotos();
  const raw = readFileSync(JSON_FILE, "utf-8");
  const listings = JSON.parse(raw) as Listing[];

  const coverRows: CoverRow[] = existsSync(COVER_CSV)
    ? (parse(readFileSync(COVER_CSV, "utf-8"), { columns: true, skip_empty_lines: true }) as CoverRow[])
    : [];
  const coverBySlug = new Map(coverRows.map((r) => [r.slug, r]));

  let added = 0;
  let replaced = 0;
  let keptCommons = 0;
  let notPublished = 0;
  const replacedHosts: Record<string, number> = {};

  for (const [slug, photo] of photos) {
    const listing = listings.find((l) => l.slug === slug);
    if (!listing || listing.status !== "published") {
      notPublished++;
      continue;
    }
    if (isCommons(listing.coverImageUrl)) {
      keptCommons++;
      continue;
    }
    if (listing.coverImageUrl) {
      const host = new URL(listing.coverImageUrl).hostname;
      replacedHosts[host] = (replacedHosts[host] ?? 0) + 1;
      replaced++;
    } else {
      added++;
    }
    listing.coverImageUrl = photo.imageUrl;
    coverBySlug.set(slug, {
      slug,
      coverImageUrl: photo.imageUrl,
      source: "wikimedia-commons",
      sourcePageUrl: photo.sourcePageUrl,
      author: photo.author,
      license: photo.license,
      licenseUrl: photo.licenseUrl,
    });
  }

  console.log(`${photos.size} venue(s) with a verified photo.`);
  console.log(`  ${added} had no photo → added`);
  console.log(`  ${replaced} had a non-licensed photo → replaced`, replacedHosts);
  console.log(`  ${keptCommons} already had a Commons photo → unchanged`);
  console.log(`  ${notPublished} not published (archived/merged) → skipped`);

  if (DRY_RUN) {
    console.log("Dry run — nothing written.");
    return;
  }
  const indent = raw.match(/^\[\n( +)/)?.[1].length ?? 2;
  writeFileSync(JSON_FILE, JSON.stringify(listings, null, indent) + (raw.endsWith("\n") ? "\n" : ""));
  writeFileSync(
    COVER_CSV,
    stringify([...coverBySlug.values()], {
      header: true,
      columns: ["slug", "coverImageUrl", "source", "sourcePageUrl", "author", "license", "licenseUrl"],
    }),
  );
  console.log(`Wrote ${path.relative(ROOT, JSON_FILE)} and ${path.relative(ROOT, COVER_CSV)}.`);
}

main();
