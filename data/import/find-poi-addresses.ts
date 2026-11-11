/**
 * Finds venue addresses that start with the name of an unrelated nearby place.
 *
 * Addresses came from Nominatim's reverse geocoding (`display_name`). When the
 * nearest OpenStreetMap object to a pin is a named place — a hotel, a pub, a
 * school, a Subway — `display_name` starts with that place's name, so the
 * Hockenheimring was listed at "Hotel Motodrom, ..." and Sebring at
 * "Gavaghan's Irish Pub, ...".
 *
 * For each published venue whose address doesn't start with a house number,
 * this reverse-geocodes the pin again and checks the result. The leading part
 * is removed only when all of these hold:
 *  - it is exactly the name of the OSM object Nominatim matched
 *  - that object isn't a road, a place (town, suburb…) or a boundary, so road
 *    names and town names are never removed
 *  - the name shares no distinctive word with the venue's name, so a pin that
 *    matched the venue itself ("Circuit Zandvoort, …") keeps it
 *  - at least two parts are left afterwards
 *
 * Writes data/import/address-fixes.csv (slug,lat,lng,oldAddress,address,
 * removed,osmCategory,osmType). sync-address-fixes.ts applies it, and
 * import-to-db.ts reads it on every import.
 *
 * Nominatim usage policy: at most 1 request per second. About 2,300 venues
 * take about 45 minutes. Progress is cached in
 * data/import/.poi-address-cache.json, so an interrupted run resumes.
 *
 * Run: npx tsx data/import/find-poi-addresses.ts [--limit N]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import type { Listing } from "../../lib/types";

const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const OUT_FILE = path.join(process.cwd(), "data", "import", "address-fixes.csv");
const CACHE_FILE = path.join(process.cwd(), "data", "import", ".poi-address-cache.json");
const NOMINATIM_USER_AGENT = "motorsport-directory-import-script/0.1 (one-time personal use)";
const MIN_REQUEST_GAP_MS = 1100;

// OSM categories whose name is a real part of an address, never a stray place.
const KEEP_CATEGORIES = new Set(["highway", "place", "boundary", "railway"]);

// Words too common in venue names to show that a place is the venue itself.
const GENERIC_WORDS = new Set([
  "karting", "kart", "karts", "kartbahn", "kartodromo", "kartodrom", "circuit", "circuito", "racing", "race",
  "raceway", "speedway", "track", "park", "motor", "motors", "motorsport", "motorsports", "club", "center",
  "centre", "indoor", "outdoor", "arena", "international", "the", "and", "sim", "simracing", "simulator",
  "racing", "speed", "world", "ring", "pista", "piste", "autodromo", "autódromo", "go-kart", "gokart",
  "school", "academy", "sport", "sports", "events", "experience", "lounge", "municipal",
]);

interface Nominatim {
  name?: string;
  display_name?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
}

function words(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
}

function namesOverlap(a: string, b: string): boolean {
  const bw = new Set(words(b));
  return words(a).some((w) => bw.has(w));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function reverse(lat: number, lng: number): Promise<Nominatim | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&accept-language=en`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
      if (res.ok) return (await res.json()) as Nominatim;
      if (res.status !== 429 && res.status < 500) return null;
    } catch {
      // network hiccup: retry below
    }
    await sleep(5000 * (attempt + 1));
  }
  return null;
}

async function main() {
  const limitArg = process.argv.indexOf("--limit");
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

  const listings: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const cache: Record<string, Nominatim | null> = existsSync(CACHE_FILE)
    ? JSON.parse(readFileSync(CACHE_FILE, "utf-8"))
    : {};

  const candidates = listings.filter((l) => !/\d/.test(l.address.split(",")[0])).slice(0, limit);
  console.log(`${candidates.length} venues without a house number first; ${Object.keys(cache).length} cached.`);

  const fixes: Record<string, string>[] = [];
  let looked = 0;
  for (const l of candidates) {
    const key = `${l.lat},${l.lng}`;
    if (!(key in cache)) {
      cache[key] = await reverse(l.lat, l.lng);
      looked++;
      if (looked % 25 === 0) {
        writeFileSync(CACHE_FILE, JSON.stringify(cache));
        process.stdout.write(`\r${looked} looked up…`);
      }
      await sleep(MIN_REQUEST_GAP_MS);
    }
    const r = cache[key];
    if (!r?.name) continue;

    const parts = l.address.split(",").map((s) => s.trim());
    const first = parts[0];
    if (first !== r.name.trim()) continue;
    if (KEEP_CATEGORIES.has(r.category ?? "")) continue;
    if (r.address && (r.address.road === first || r.address.city === first || r.address.town === first || r.address.village === first)) continue;
    if (namesOverlap(first, l.name)) continue;
    const rest = parts.slice(1).filter(Boolean);
    if (rest.length < 2) continue;

    fixes.push({
      slug: l.slug,
      lat: String(l.lat),
      lng: String(l.lng),
      oldAddress: l.address,
      address: rest.join(", "),
      removed: first,
      osmCategory: r.category ?? "",
      osmType: r.type ?? "",
    });
  }
  writeFileSync(CACHE_FILE, JSON.stringify(cache));

  writeFileSync(
    OUT_FILE,
    stringify(fixes, {
      header: true,
      columns: ["slug", "lat", "lng", "oldAddress", "address", "removed", "osmCategory", "osmType"],
    })
  );
  console.log(`\n${fixes.length} addresses to fix -> ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
