/**
 * Step 1 of the import pipeline.
 *
 * Reads every source file from data/import/raw/ — any mix of:
 *  - a Google Takeout named-list export (CSV, Title/Note/URL columns)
 *  - the Takeout default "Saved places" list (GeoJSON, e.g. `Saved Places.json`)
 *  - a "shared list" scrape (CSV, Title/VenueType/Rating/ReviewCount columns —
 *    see README's "Importing from a shared Google Maps list" section)
 *  - a manual address list (CSV, Title/Address/VenueType/WebsiteUrl/Phone —
 *    for places looked up by hand; geocoded by address, not by name)
 * — resolves each place's coordinates (following/geocoding as needed),
 * reverse-geocodes an address/city/country via OpenStreetMap's free
 * Nominatim API, and guesses a category from the place name / venue type.
 *
 * Run: npm run import:parse
 * Output: data/import/review.csv — open it in Excel/Sheets, fix categories
 * (rows with needsReview=yes especially need a look) and any wrong/missing
 * fields, then run `npm run import:load`.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import slugify from "slugify";

const RAW_DIR = path.join(process.cwd(), "data", "import", "raw");
const OUT_FILE = path.join(process.cwd(), "data", "import", "review.csv");
const NOMINATIM_USER_AGENT = "motorsport-directory-import-script/0.1 (one-time personal use)";

interface TakeoutRow {
  Title?: string;
  Note?: string;
  Comment?: string;
  URL?: string;
}

interface SharedListRow {
  Title?: string;
  VenueType?: string;
  Rating?: string;
  ReviewCount?: string;
}

interface AddressListRow {
  Title?: string;
  Address?: string;
  VenueType?: string;
  WebsiteUrl?: string;
  Phone?: string;
}

// Google's own venue-type label for a place (shown on shared-list pages),
// mapped to our categories. Absent or unmapped => leave uncategorized and
// flag the row for manual review rather than guessing wrong.
const VENUE_TYPE_CATEGORY: Record<string, string[]> = {
  "go-karting venue": ["karting"],
  "car racing venue": ["track_day"],
  racecourse: ["track_day"],
};
// Venue types that are motorsport-adjacent but not one of our 3 categories —
// still imported, but flagged so the user decides whether to keep them.
const VENUE_TYPE_NEEDS_REVIEW = new Set([
  "sports complex",
  "club",
  "event management company",
  "children's amusement center",
  "training center",
  "park",
  "road safety town",
]);

interface TakeoutGeoJsonFeature {
  type?: string;
  geometry?: { type?: string; coordinates?: [number, number] };
  properties?: {
    date?: string;
    google_maps_url?: string;
    Comment?: string;
    Note?: string;
    location?: { name?: string; address?: string; country_code?: string };
    Location?: { name?: string; address?: string; country_code?: string };
  };
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
  needsReview: string;
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

/**
 * Google's GeoJSON export often has no usable geometry (a `[0, 0]`
 * placeholder, with a Comment like "No location information is available
 * for this saved place"). When that happens, the place's name/address is
 * usually still recoverable from the `google_maps_url` itself: either a
 * `/maps/place/<name>/...` path segment, or a `q=<address>` query param for
 * places Google never resolved to a listing.
 */
function parseGoogleMapsUrl(url: string): { name?: string; address?: string } {
  if (!url) return {};
  try {
    const u = new URL(url);
    const placeMatch = u.pathname.match(/\/maps\/place\/([^/]+)/);
    if (placeMatch) {
      return { name: decodeURIComponent(placeMatch[1].replace(/\+/g, " ")) };
    }
    const q = u.searchParams.get("q");
    if (q) {
      return { address: q };
    }
  } catch {
    // Not a parseable URL — ignore.
  }
  return {};
}

// Roughly covers mainland Europe (Portugal to Finland/western Russia, Sicily
// to North Cape). Used for both name-only geocoding (shared-list import) and
// address geocoding (manual-address-list import), where an unconstrained
// global search occasionally matches a same-named place on another continent
// (seen: "Amazinga" -> Solomon Islands) instead of failing outright.
// lat_max was previously 58, which silently excluded all of Scandinavia
// (Stockholm/Oslo/Helsinki sit at ~59-60N) — bounded search returned zero
// results for those even with a correct address.
const EUROPE_VIEWBOX = "-11,71,31,35"; // lon_min,lat_max,lon_max,lat_min

async function forwardGeocode(
  query: string,
  options?: { boundedToEurope?: boolean }
): Promise<{ lat: number; lng: number } | null> {
  const params = new URLSearchParams({ q: query, format: "jsonv2", limit: "1" });
  if (options?.boundedToEurope) {
    params.set("viewbox", EUROPE_VIEWBOX);
    params.set("bounded", "1");
  }
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number) {
  // Nominatim usage policy: max 1 req/sec, requires an identifying User-Agent.
  // accept-language=en: Nominatim otherwise returns country/city/address in
  // the local language, which doesn't match the rest of this English site.
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
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

/**
 * Handles the GeoJSON "Saved places" export (default list, no custom name —
 * usually saved from the Google Maps app, not a named list). One row per
 * feature; falls back to forward-geocoding when Google didn't resolve
 * coordinates for a place.
 */
async function processGeoJsonFile(filePath: string, fileLabel: string): Promise<ReviewRow[]> {
  const content = readFileSync(filePath, "utf-8");
  const geojson = JSON.parse(content);
  const features: TakeoutGeoJsonFeature[] = Array.isArray(geojson?.features) ? geojson.features : [];

  const output: ReviewRow[] = [];
  let i = 0;
  for (const feature of features) {
    i++;
    const props = feature.properties ?? {};
    const locationInfo = props.location ?? props.Location;
    const { name: urlName, address: urlAddress } = parseGoogleMapsUrl(props.google_maps_url ?? "");
    const coords = feature.geometry?.coordinates;
    const hasValidCoords = Array.isArray(coords) && (coords[0] !== 0 || coords[1] !== 0);

    let lat: number | undefined;
    let lng: number | undefined;

    if (hasValidCoords) {
      [lng, lat] = coords as [number, number];
    } else {
      const addressToGeocode = locationInfo?.address ?? urlAddress;
      process.stdout.write(`Resolving ${i}/${features.length} from ${fileLabel} (no coordinates, geocoding address)...`);
      if (addressToGeocode) {
        const geocoded = await forwardGeocode(addressToGeocode);
        if (geocoded) {
          lat = geocoded.lat;
          lng = geocoded.lng;
        }
        await sleep(1100);
      }
    }

    if (lat === undefined || lng === undefined) {
      console.log(
        ` could not resolve a location for ${
          locationInfo?.name ?? urlName ?? urlAddress ?? `feature #${i}`
        }, skipping (fix manually if needed).`
      );
      continue;
    }

    const geo = await reverseGeocode(lat, lng);
    const name = locationInfo?.name ?? urlName ?? urlAddress ?? geo.address ?? `Saved place ${i}`;
    console.log(hasValidCoords ? `Resolved ${i}/${features.length}: ${name} -> ${geo.city || "?"}, ${geo.country || "?"}` : ` ${geo.city || "?"}, ${geo.country || "?"}`);

    output.push({
      name,
      slug: slugify(name, { lower: true, strict: true }),
      categories: guessCategories(name).join("|"),
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
      address: geo.address || locationInfo?.address || urlAddress || "",
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      indoorOutdoor: "",
      websiteUrl: "",
      phone: "",
      description: "",
      googleMapsUrl: props.google_maps_url ?? "",
      originalNote: props.Comment ?? props.Note ?? "",
      needsReview: "",
    });

    if (hasValidCoords) {
      // Still stay well under Nominatim's 1 req/sec limit for the reverse-geocode call.
      await sleep(1100);
    }
  }

  return output;
}

/**
 * Handles a "shared list" export: Title/VenueType/Rating/ReviewCount columns
 * (see README — scraped from a public Google Maps shared-list page rather
 * than a personal Takeout export). No URL or coordinates are available per
 * row, so each place is forward-geocoded by name via Nominatim.
 */
async function processSharedListFile(filePath: string, fileLabel: string): Promise<ReviewRow[]> {
  const content = readFileSync(filePath, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as SharedListRow[];

  const output: ReviewRow[] = [];
  const skipped: string[] = [];
  let i = 0;
  for (const row of rows) {
    i++;
    const title = row.Title?.trim();
    if (!title) continue;

    process.stdout.write(`Resolving ${i}/${rows.length} from ${fileLabel}: ${title}...`);
    let coords = await forwardGeocode(title, { boundedToEurope: true });
    await sleep(1100);
    let usedUnboundedFallback = false;
    if (!coords) {
      // Retry unbounded in case it's just outside the (approximate) Europe
      // box; still name-only, so double-check whatever this returns too.
      coords = await forwardGeocode(title);
      usedUnboundedFallback = true;
      await sleep(1100);
    }
    if (!coords) {
      console.log(" could not geocode by name — add this one manually.");
      skipped.push(`${title}${row.VenueType ? ` (${row.VenueType})` : ""}`);
      continue;
    }

    const geo = await reverseGeocode(coords.lat, coords.lng);
    await sleep(1100);
    console.log(` ${geo.city || "?"}, ${geo.country || "?"}${usedUnboundedFallback ? " (outside Europe box — verify!)" : ""}`);

    const venueType = row.VenueType?.trim().toLowerCase() ?? "";
    const mappedCategories = VENUE_TYPE_CATEGORY[venueType];
    const categories = mappedCategories ?? guessCategories(title);
    const flagged = !mappedCategories || VENUE_TYPE_NEEDS_REVIEW.has(venueType) || usedUnboundedFallback;

    output.push({
      name: title,
      slug: slugify(title, { lower: true, strict: true }),
      categories: categories.join("|"),
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
      originalNote: row.VenueType
        ? `${row.VenueType}${row.Rating ? ` · ${row.Rating}★ (${row.ReviewCount ?? "?"})` : ""}`
        : "",
      needsReview: flagged ? "yes" : "",
    });
  }

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} place(s) from ${fileLabel} could not be geocoded by name and were skipped:`);
    for (const name of skipped) console.log(`  - ${name}`);
    console.log("Add these to review.csv by hand (look up the address on Google Maps).");
  }

  return output;
}

/**
 * Handles a "manual address" file: Title/Address/VenueType/WebsiteUrl/Phone
 * columns — for places looked up by hand (e.g. from each place's Google Maps
 * detail page) rather than resolved automatically. Forward-geocodes the
 * address itself (far more reliable than geocoding by name alone).
 */
async function processAddressListFile(filePath: string, fileLabel: string): Promise<ReviewRow[]> {
  const content = readFileSync(filePath, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as AddressListRow[];

  const output: ReviewRow[] = [];
  const skipped: string[] = [];
  let i = 0;
  for (const row of rows) {
    i++;
    const title = row.Title?.trim();
    const address = row.Address?.trim();
    if (!title || !address) continue;

    process.stdout.write(`Resolving ${i}/${rows.length} from ${fileLabel}: ${title}...`);
    const coords = await forwardGeocode(address, { boundedToEurope: true });
    await sleep(1100);
    if (!coords) {
      console.log(" could not geocode this address, skipping.");
      skipped.push(`${title} (${address})`);
      continue;
    }

    const geo = await reverseGeocode(coords.lat, coords.lng);
    await sleep(1100);
    console.log(` ${geo.city || "?"}, ${geo.country || "?"}`);

    const venueType = row.VenueType?.trim().toLowerCase() ?? "";
    const mappedCategories = VENUE_TYPE_CATEGORY[venueType];
    const categories = mappedCategories ?? guessCategories(title);
    const flagged = !mappedCategories || VENUE_TYPE_NEEDS_REVIEW.has(venueType);

    output.push({
      name: title,
      slug: slugify(title, { lower: true, strict: true }),
      categories: categories.join("|"),
      country: geo.country,
      countryCode: geo.countryCode,
      city: geo.city,
      address: geo.address || address,
      lat: coords.lat.toFixed(6),
      lng: coords.lng.toFixed(6),
      indoorOutdoor: "",
      websiteUrl: row.WebsiteUrl ?? "",
      phone: row.Phone ?? "",
      description: "",
      googleMapsUrl: "",
      originalNote: row.VenueType ?? "",
      needsReview: flagged ? "yes" : "",
    });
  }

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} place(s) from ${fileLabel} could not be geocoded and were skipped:`);
    for (const name of skipped) console.log(`  - ${name}`);
  }

  return output;
}

/**
 * Handles an "f1 circuits" file: single Title column, one famous circuit per
 * row (ideally "Official name, City, Country" for unambiguous geocoding).
 * Every row is tagged category "f1" and geocoded globally — unlike every
 * other source here, deliberately NOT bounded to Europe, since F1 races on
 * every inhabited continent.
 */
async function processF1ListFile(filePath: string, fileLabel: string): Promise<ReviewRow[]> {
  const content = readFileSync(filePath, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as { Title?: string }[];

  const output: ReviewRow[] = [];
  const skipped: string[] = [];
  let i = 0;
  for (const row of rows) {
    i++;
    const title = row.Title?.trim();
    if (!title) continue;
    const displayName = title.split(",")[0].trim();

    process.stdout.write(`Resolving ${i}/${rows.length} from ${fileLabel}: ${displayName}...`);
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

    output.push({
      name: displayName,
      slug: slugify(displayName, { lower: true, strict: true }),
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

  if (skipped.length > 0) {
    console.log(`\n${skipped.length} circuit(s) from ${fileLabel} could not be geocoded and were skipped:`);
    for (const name of skipped) console.log(`  - ${name}`);
  }

  return output;
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    mkdirSync(RAW_DIR, { recursive: true });
    console.log(
      `Created ${RAW_DIR}. Put your Google Takeout "Maps (your places)" export(s) there and re-run this script.`
    );
    return;
  }

  const files = readdirSync(RAW_DIR).filter((f) => f.endsWith(".csv") || f.endsWith(".json"));
  if (files.length === 0) {
    console.log(`No CSV or JSON files found in ${RAW_DIR}. See README.md for the Google Takeout export steps.`);
    return;
  }

  const output: ReviewRow[] = [];

  // GeoJSON exports (default "Saved places" list) — one row per feature.
  for (const file of files.filter((f) => f.endsWith(".json"))) {
    const geoRows = await processGeoJsonFile(path.join(RAW_DIR, file), file);
    console.log(`Read ${geoRows.length} usable place(s) from ${file}`);
    output.push(...geoRows);
  }

  // CSV exports: Takeout named lists (Title/Note/URL), shared-list scrapes
  // (Title/VenueType/Rating/ReviewCount), or manual address lists
  // (Title/Address/VenueType/WebsiteUrl/Phone) — see README — told apart by header.
  const csvFiles = files.filter((f) => f.endsWith(".csv"));
  const rows: TakeoutRow[] = [];
  for (const file of csvFiles) {
    const filePath = path.join(RAW_DIR, file);
    const content = readFileSync(filePath, "utf-8");
    const header = content.slice(0, 200);

    if (/^f1-/i.test(file)) {
      const f1Rows = await processF1ListFile(filePath, file);
      console.log(`Read ${f1Rows.length} usable place(s) from ${file}`);
      output.push(...f1Rows);
      continue;
    }

    if (/(^|,)Address(,|$)/m.test(header)) {
      const addressRows = await processAddressListFile(filePath, file);
      console.log(`Read ${addressRows.length} usable place(s) from ${file}`);
      output.push(...addressRows);
      continue;
    }

    if (/(^|,)VenueType(,|$)/m.test(header)) {
      const sharedRows = await processSharedListFile(filePath, file);
      console.log(`Read ${sharedRows.length} usable place(s) from ${file}`);
      output.push(...sharedRows);
      continue;
    }

    const parsed = parse(content, { columns: true, skip_empty_lines: true }) as TakeoutRow[];
    rows.push(...parsed);
    console.log(`Read ${parsed.length} rows from ${file}`);
  }

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
      needsReview: "",
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
