/**
 * Step 1 of the import pipeline.
 *
 * Reads every Google Takeout "saved places" CSV from data/import/raw/,
 * resolves each place's shortened Google Maps URL to real coordinates,
 * reverse-geocodes an address/city/country via OpenStreetMap's free
 * Nominatim API, and guesses a category from the place name.
 *
 * Run: npm run import:parse
 * Output: data/import/review.csv — open it in Excel/Sheets, fix categories
 * and any wrong/missing fields, then run `npm run import:load`.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import slugify from "slugify";

const RAW_DIR = path.join(process.cwd(), "data", "import", "raw");
const OUT_FILE = path.join(process.cwd(), "data", "import", "review.csv");

interface TakeoutRow {
  Title?: string;
  Note?: string;
  Comment?: string;
  URL?: string;
}

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
  googleMapsUrl: string;
  originalNote: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  karting: ["kart", "karting", "kartodromo", "kartbahn", "kartcenter"],
  sim_racing: ["sim racing", "simracing", "simulator", "esports", "sim center", "simcenter"],
  track_day: [
    "circuit",
    "raceway",
    "racetrack",
    "race track",
    "motorsport park",
    "ring",
    "speedway",
    "rennstrecke",
  ],
};

function guessCategories(name: string): string[] {
  const lower = name.toLowerCase();
  const matches = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((k) => lower.includes(k)))
    .map(([category]) => category);
  return matches.length > 0 ? matches : [];
}

async function resolveCoordinates(url: string): Promise<{ lat: number; lng: number; finalUrl: string } | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const finalUrl = res.url;
    // Matches both "@lat,lng,zoom" and "!3dLAT!4dLNG" URL shapes.
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]), finalUrl };
    }
    const dMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (dMatch) {
      return { lat: parseFloat(dMatch[1]), lng: parseFloat(dMatch[2]), finalUrl };
    }
    return null;
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number) {
  // Nominatim usage policy: max 1 req/sec, requires an identifying User-Agent.
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "motorsport-directory-import-script/0.1 (one-time personal use)" },
    });
    const data = await res.json();
    const addr = data.address ?? {};
    return {
      address: data.display_name ?? "",
      city: addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "",
      country: addr.country ?? "",
      countryCode: (addr.country_code ?? "").toUpperCase(),
    };
  } catch {
    return { address: "", city: "", country: "", countryCode: "" };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    mkdirSync(RAW_DIR, { recursive: true });
    console.log(
      `Created ${RAW_DIR}. Put your Google Takeout "Maps (your places)" CSV file(s) there and re-run this script.`
    );
    return;
  }

  const files = readdirSync(RAW_DIR).filter((f) => f.endsWith(".csv"));
  if (files.length === 0) {
    console.log(`No CSV files found in ${RAW_DIR}. See README.md for the Google Takeout export steps.`);
    return;
  }

  const rows: TakeoutRow[] = [];
  for (const file of files) {
    const content = readFileSync(path.join(RAW_DIR, file), "utf-8");
    const parsed = parse(content, { columns: true, skip_empty_lines: true }) as TakeoutRow[];
    rows.push(...parsed);
    console.log(`Read ${parsed.length} rows from ${file}`);
  }

  const output: ReviewRow[] = [];
  let i = 0;
  for (const row of rows) {
    i++;
    const title = row.Title?.trim();
    const url = row.URL?.trim();
    if (!title || !url) continue;

    process.stdout.write(`Resolving ${i}/${rows.length}: ${title}...`);
    const coords = await resolveCoordinates(url);
    if (!coords) {
      console.log(" could not resolve coordinates, skipping (fix manually if needed).");
      continue;
    }

    const geo = await reverseGeocode(coords.lat, coords.lng);
    console.log(` ${geo.city || "?"}, ${geo.country || "?"}`);

    output.push({
      name: title,
      slug: slugify(title, { lower: true, strict: true }),
      categories: guessCategories(title).join("|"),
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
      googleMapsUrl: coords.finalUrl,
      originalNote: row.Note ?? row.Comment ?? "",
    });

    // Stay well under Nominatim's 1 req/sec limit.
    await sleep(1100);
  }

  const csv = stringify(output, { header: true });
  writeFileSync(OUT_FILE, csv);
  console.log(`\nWrote ${output.length} rows to ${OUT_FILE}`);
  console.log(
    "Open it in Excel/Sheets: confirm/fix `categories` (pipe-separated, e.g. track_day|karting), " +
      "fill in websiteUrl/phone/description where you know them, then run `npm run import:load`."
  );
}

main();
