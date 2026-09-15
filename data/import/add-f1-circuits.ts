/**
 * One-off: geocodes data/import/raw/f1-circuits.csv (global, unbounded —
 * F1 races on every inhabited continent) and APPENDS the results to the
 * existing data/import/review.csv rather than regenerating it, since
 * review.csv has grown beyond what the raw/ source files alone would
 * reproduce. Run once: npx tsx data/import/add-f1-circuits.ts
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import slugify from "slugify";

const RAW_FILE = path.join(process.cwd(), "data", "import", "raw", "f1-circuits.csv");
const REVIEW_FILE = path.join(process.cwd(), "data", "import", "review.csv");
const NOMINATIM_USER_AGENT = "motorsport-directory-import-script/0.1 (one-time personal use)";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function forwardGeocode(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "1",
  })}`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

async function reverseGeocode(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  const data = await res.json();
  const addr = data.address ?? {};
  return {
    address: data.display_name ?? "",
    city: addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.state ?? "",
    country: addr.country ?? "",
    countryCode: (addr.country_code ?? "").toUpperCase(),
  };
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.log(`${RAW_FILE} not found.`);
    return;
  }
  if (!existsSync(REVIEW_FILE)) {
    console.log(`${REVIEW_FILE} not found — run the main import pipeline at least once first.`);
    return;
  }

  const rows = parse(readFileSync(RAW_FILE, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  }) as { Title?: string }[];

  const existingReview = parse(readFileSync(REVIEW_FILE, "utf-8"), {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
  const existingSlugs = new Set(existingReview.map((r) => r.slug));

  const newRows: Record<string, string>[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const title = rows[i].Title?.trim();
    if (!title) continue;
    const displayName = title.split(",")[0].trim();
    const slug = slugify(displayName, { lower: true, strict: true });

    if (existingSlugs.has(slug)) {
      console.log(`Skipping ${displayName}: slug "${slug}" already exists in review.csv`);
      continue;
    }

    process.stdout.write(`Resolving ${i + 1}/${rows.length}: ${displayName}...`);
    const coords = await forwardGeocode(title);
    await sleep(1100);
    if (!coords) {
      console.log(" could not geocode, skipping.");
      skipped.push(title);
      continue;
    }

    const geo = await reverseGeocode(coords.lat, coords.lng);
    await sleep(1100);
    console.log(` ${geo.city || "?"}, ${geo.country || "?"}`);

    newRows.push({
      name: displayName,
      slug,
      categories: "f1",
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
      address: geo.address,
      lat: coords.lat.toFixed(6),
      lng: coords.lng.toFixed(6),
      indoorOutdoor: "",
      websiteUrl: "",
      phone: "",
      description: "",
      googleMapsUrl: "",
      originalNote: "Formula 1 circuit",
      needsReview: "",
    });
  }

  if (newRows.length > 0) {
    const header = Object.keys(existingReview[0]);
    const csv = stringify([...existingReview, ...newRows], { header: true, columns: header });
    writeFileSync(REVIEW_FILE, csv);
    console.log(`\nAppended ${newRows.length} F1 circuits to ${REVIEW_FILE} (total ${existingReview.length + newRows.length} rows).`);
  }

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} circuit(s) could not be geocoded and need manual coordinates:`);
    for (const name of skipped) console.log(`  - ${name}`);
  }
}

main();
