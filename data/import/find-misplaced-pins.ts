/**
 * Flags published venues whose map pin is probably not at the venue.
 *
 * find-approximate-locations.ts only caught pins shared by several venues.
 * A venue alone on a fallback pin slipped through: Cadwell Park sat in Louth
 * town centre, Sebring in downtown Sebring. Two independent signals:
 *
 *  - town-centre: the pin is within TOWN_CENTRE_KM of the point OpenStreetMap
 *    gives for the venue's city, which is where geocoding falls back to when
 *    it can't find the venue itself. Indoor venues in a city centre can sit
 *    there legitimately, so these are checked, not condemned.
 *  - no-track: a track-day circuit or club circuit with no race track mapped
 *    in OpenStreetMap (highway=raceway, or a motor sport track or centre)
 *    within TRACK_RADIUS_KM. Circuits are large, well mapped features.
 *
 * Writes data/import/pin-suspects.csv (slug,name,city,country,reasons,...),
 * which relocate-approximate-venues.ts --suspects reads.
 *
 * Nominatim: at most 1 request per second, cached in the same file as
 * relocate-approximate-venues.ts. Overpass: one query per 25 venues.
 *
 * Run: npx tsx data/import/find-misplaced-pins.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import type { Listing } from "../../lib/types";

const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const OUT_FILE = path.join(process.cwd(), "data", "import", "pin-suspects.csv");
const CACHE_FILE = path.join(os.tmpdir(), "racefinder-nominatim-cache.json");
const OVERPASS_CACHE_FILE = path.join(os.tmpdir(), "racefinder-overpass-cache.json");
const NOMINATIM_USER_AGENT = "motorsport-directory-import-script/0.1 (one-time personal use)";
const MIN_REQUEST_GAP_MS = 1100;
const TOWN_CENTRE_KM = 0.3;
const TRACK_RADIUS_KM = 1.5;
const OVERPASS_BATCH = 15;
// Public Overpass servers, tried in turn when one is busy or rate-limits.
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

interface Point {
  lat: number;
  lng: number;
}

function km(a: Point, b: Point): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const cache: Record<string, unknown> = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf-8")) : {};
let lastNominatimAt = 0;

// Same request (and cache key) as relocate-approximate-venues.ts, so the
// relocation step reuses these answers.
async function searchNominatim(q: string, countryCode: string): Promise<{ lat: string; lon: string; category?: string }[]> {
  const params: Record<string, string> = { q, limit: "10", addressdetails: "1", namedetails: "1" };
  if (/^[A-Z]{2}$/.test(countryCode) && countryCode !== "XX") params.countrycodes = countryCode.toLowerCase();
  const key = `search?${new URLSearchParams({ format: "jsonv2", "accept-language": "en", ...params }).toString()}`;
  if (!(key in cache)) {
    for (let attempt = 0; attempt < 4 && !(key in cache); attempt++) {
      const wait = lastNominatimAt + MIN_REQUEST_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastNominatimAt = Date.now();
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/${key}`, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
        if (res.ok) cache[key] = await res.json();
        else await sleep(5000 * (attempt + 1));
      } catch {
        await sleep(3000 * (attempt + 1));
      }
    }
  }
  const data = cache[key];
  return Array.isArray(data) ? data : [];
}

async function cityCentre(city: string, country: string, countryCode: string): Promise<Point | null> {
  const results = await searchNominatim(`${city}, ${country}`, countryCode);
  const r = results.find((x) => x.category === "place" || x.category === "boundary") ?? results[0];
  return r ? { lat: parseFloat(r.lat), lng: parseFloat(r.lon) } : null;
}

const overpassCache: Record<string, Point[]> = existsSync(OVERPASS_CACHE_FILE)
  ? JSON.parse(readFileSync(OVERPASS_CACHE_FILE, "utf-8"))
  : {};

// Motor sport tracks near each venue, one Overpass query per batch.
async function tracksNear(venues: Listing[]): Promise<Map<string, Point[]>> {
  const out = new Map<string, Point[]>();
  const todo = venues.filter((v) => !(v.slug in overpassCache));
  for (let i = 0; i < todo.length; i += OVERPASS_BATCH) {
    const batch = todo.slice(i, i + OVERPASS_BATCH);
    const r = TRACK_RADIUS_KM * 1000;
    const clauses = batch
      .map((v) => {
        const at = `(around:${r},${v.lat},${v.lng})`;
        return `nwr[highway=raceway]${at};nwr[leisure=track][sport~"motor|kart|speedway|moto|rally|drift"]${at};nwr[leisure=sports_centre][sport~"motor|kart"]${at};`;
      })
      .join("");
    const query = `[out:json][timeout:180];(${clauses});out center;`;
    let elements: { lat?: number; lon?: number; center?: { lat: number; lon: number } }[] | null = null;
    for (let attempt = 0; attempt < 9 && !elements; attempt++) {
      try {
        const res = await fetch(OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length], {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": NOMINATIM_USER_AGENT },
          body: `data=${encodeURIComponent(query)}`,
        });
        if (res.ok) elements = (await res.json()).elements;
        else await sleep(20000 * (Math.floor(attempt / OVERPASS_ENDPOINTS.length) + 1));
      } catch {
        await sleep(20000 * (Math.floor(attempt / OVERPASS_ENDPOINTS.length) + 1));
      }
    }
    if (!elements) throw new Error("Overpass failed repeatedly");
    const points = elements
      .map((e) => (e.center ? { lat: e.center.lat, lng: e.center.lon } : e.lat != null ? { lat: e.lat, lng: e.lon! } : null))
      .filter((p): p is Point => p !== null);
    for (const v of batch) overpassCache[v.slug] = points.filter((p) => km(p, v) <= TRACK_RADIUS_KM + 0.5);
    writeFileSync(OVERPASS_CACHE_FILE, JSON.stringify(overpassCache));
    process.stdout.write(`\rOverpass: ${Math.min(i + OVERPASS_BATCH, todo.length)}/${todo.length}`);
    await sleep(5000);
  }
  for (const v of venues) out.set(v.slug, overpassCache[v.slug] ?? []);
  return out;
}

async function main() {
  const listings: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const reasons = new Map<string, string[]>();
  const flag = (slug: string, reason: string) => reasons.set(slug, [...(reasons.get(slug) ?? []), reason]);

  // The two checks use different services (Overpass, Nominatim), so they run
  // side by side.
  // 1. Circuits with no mapped track nearby.
  const circuits = listings.filter((l) => l.categories.includes("track_day") || l.categories.includes("club_only"));
  const trackCheck = (async () => {
    console.log(`Checking ${circuits.length} circuits against OpenStreetMap tracks…`);
    const tracks = await tracksNear(circuits);
    for (const c of circuits) if ((tracks.get(c.slug) ?? []).length === 0) flag(c.slug, "no-track");
    console.log("\nTrack check done.");
  })();

  // 2. Pins on their town's centre point.
  const townCheck = (async () => {
    const cities = new Map<string, Listing[]>();
    for (const l of listings) {
      if (!l.city) continue;
      const key = `${l.city}|${l.country}|${l.countryCode}`;
      cities.set(key, [...(cities.get(key) ?? []), l]);
    }
    console.log(`Geocoding ${cities.size} towns…`);
    let n = 0;
    for (const [key, venues] of cities) {
      const [city, country, cc] = key.split("|");
      const centre = await cityCentre(city, country, cc);
      if (centre) for (const v of venues) if (km(centre, v) <= TOWN_CENTRE_KM) flag(v.slug, "town-centre");
      if (++n % 50 === 0) {
        writeFileSync(CACHE_FILE, JSON.stringify(cache));
        console.log(`Towns: ${n}/${cities.size}`);
      }
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache));
  })();
  await Promise.all([trackCheck, townCheck]);

  const rows = listings
    .filter((l) => reasons.has(l.slug))
    .map((l) => ({
      slug: l.slug,
      name: l.name,
      categories: l.categories.join("|"),
      city: l.city,
      country: l.country,
      reasons: reasons.get(l.slug)!.join("|"),
      lat: l.lat,
      lng: l.lng,
      address: l.address,
      websiteUrl: l.websiteUrl ?? "",
    }));
  writeFileSync(OUT_FILE, stringify(rows, { header: true }));
  const count = (r: string) => rows.filter((x) => x.reasons.includes(r)).length;
  console.log(`\n${rows.length} suspects (${count("no-track")} no-track, ${count("town-centre")} town-centre) -> ${OUT_FILE}`);
}

main().catch((err) => {
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
  console.error(err);
  process.exit(1);
});
