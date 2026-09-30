/**
 * Step 2 of the import pipeline.
 *
 * Reads your reviewed data/import/review.csv and:
 *  - always writes data/generated-listings.json (loaded by
 *    data/generated-listings.ts for the sync scripts; JSON rather than a TS
 *    array literal, which TypeScript can't type-check at this size)
 *  - additionally upserts into Postgres via Drizzle, if DATABASE_URL is set
 *    (i.e. once a Supabase project exists — see .env.example)
 *
 * Also merges in data/import/cover-images.csv (slug,coverImageUrl,source) if
 * present, keyed by slug. That file is separate from review.csv because
 * `npm run import:parse` regenerates review.csv from scratch on every run —
 * anything hand-added there would get wiped, so cover photos live in their
 * own persistent file instead.
 *
 * Run: npm run import:load
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import "dotenv/config";
import { listingSchema } from "../../lib/validation/listing";
import type { Category, Listing } from "../../lib/types";
import { normalizeCountry } from "../../lib/countryNames";

const REVIEW_FILE = path.join(process.cwd(), "data", "import", "review.csv");
const COVER_IMAGES_FILE = path.join(process.cwd(), "data", "import", "cover-images.csv");
const OUT_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const UPSERT_BATCH_SIZE = 500;

interface ReviewRow {
  name: string;
  slug: string;
  categories: string;
  country: string;
  countryCode: string;
  city: string;
  address: string;
  lat: string;
  lng: string;
  indoorOutdoor: string;
  websiteUrl: string;
  phone: string;
  description: string;
  trackLengthM: string;
  kartType: string;
  maxKartSpeedKmh: string;
  minAgeOrHeight: string;
  openingHours: string;
  googleMapsUrl: string;
  originalNote: string;
}

function loadCoverImages(): Map<string, string> {
  const bySlug = new Map<string, string>();
  if (!existsSync(COVER_IMAGES_FILE)) return bySlug;

  const content = readFileSync(COVER_IMAGES_FILE, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as {
    slug: string;
    coverImageUrl: string;
  }[];
  for (const row of rows) {
    if (row.slug && row.coverImageUrl) bySlug.set(row.slug, row.coverImageUrl);
  }
  return bySlug;
}

function toListing(row: ReviewRow, id: string, coverImages: Map<string, string>): Listing | null {
  const categories = row.categories
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean) as Category[];

  const candidate = {
    slug: row.slug,
    name: row.name,
    categories,
    status: "published" as const,
    ...normalizeCountry(row.country, row.countryCode || "XX"),
    city: row.city,
    address: row.address,
    lat: parseFloat(row.lat),
    lng: parseFloat(row.lng),
    websiteUrl: row.websiteUrl || undefined,
    phone: row.phone || undefined,
    description: row.description || undefined,
    coverImageUrl: coverImages.get(row.slug) || undefined,
    googleMapsUrl: row.googleMapsUrl || undefined,
    indoorOutdoor: (row.indoorOutdoor || undefined) as Listing["indoorOutdoor"],
    trackLengthM: row.trackLengthM ? parseFloat(row.trackLengthM) : undefined,
    openingHours: row.openingHours || undefined,
    details: categories.includes("karting") && (row.kartType || row.maxKartSpeedKmh || row.minAgeOrHeight)
      ? {
          karting: {
            kart_type: (row.kartType || undefined) as "petrol" | "electric" | "both" | undefined,
            max_kart_speed_kmh: row.maxKartSpeedKmh ? parseFloat(row.maxKartSpeedKmh) : undefined,
            min_age_or_height: row.minAgeOrHeight || undefined,
          },
        }
      : undefined,
  };

  const result = listingSchema.safeParse(candidate);
  if (!result.success) {
    console.warn(`Skipping "${row.name}": ${result.error.issues.map((i) => i.message).join(", ")}`);
    return null;
  }

  return { id, ...result.data };
}

async function main() {
  if (!existsSync(REVIEW_FILE)) {
    console.log(`${REVIEW_FILE} not found. Run \`npm run import:parse\` first.`);
    return;
  }

  const content = readFileSync(REVIEW_FILE, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as ReviewRow[];
  const coverImages = loadCoverImages();

  const listings: Listing[] = [];
  rows.forEach((row, index) => {
    const listing = toListing(row, String(index + 1), coverImages);
    if (listing) listings.push(listing);
  });

  writeFileSync(OUT_FILE, JSON.stringify(listings, null, 2) + "\n");
  console.log(`Wrote ${listings.length} listings to ${OUT_FILE}`);

  if (process.env.DATABASE_URL) {
    const { db } = await import("../../lib/db/client");
    const { listings: listingsTable } = await import("../../lib/db/schema");
    // One INSERT per 500 rows rather than per row: thousands of sequential
    // round-trips are enough to push the database into statement timeouts
    // for the live site while an import runs.
    for (let i = 0; i < listings.length; i += UPSERT_BATCH_SIZE) {
      const batch = listings.slice(i, i + UPSERT_BATCH_SIZE);
      await db
        .insert(listingsTable)
        .values(
          batch.map((listing) => ({
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
            websiteUrl: listing.websiteUrl,
            phone: listing.phone,
            description: listing.description,
            coverImageUrl: listing.coverImageUrl,
            googleMapsUrl: listing.googleMapsUrl,
            indoorOutdoor: listing.indoorOutdoor,
            trackLengthM: listing.trackLengthM !== undefined ? String(listing.trackLengthM) : undefined,
            openingHours: listing.openingHours,
            details: listing.details,
          }))
        )
        .onConflictDoNothing({ target: listingsTable.slug });
    }
    console.log(`Upserted ${listings.length} listings into Postgres.`);
  } else {
    console.log("DATABASE_URL not set — skipped the database upsert (generated-listings.json is still written).");
  }
}

main();
