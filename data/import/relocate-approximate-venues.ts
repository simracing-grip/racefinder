/**
 * Re-locates venues whose pin is shared with another venue (see
 * find-approximate-locations.ts) and writes the verdicts to
 * data/import/location-fixes.csv, which sync-location-fixes.ts applies.
 *
 * Every venue on a shared point is treated as suspect — even when the venues
 * share one address, that address usually came from reverse-geocoding the
 * same fallback pin (a downtown landmark, a country's geographic centre).
 * A pin is only kept or moved on independent evidence:
 *  - OpenStreetMap (Nominatim search): a venue-type feature (not a town or
 *    street) whose name carries the venue's distinctive name words, near the
 *    venue's city — or, when the stored city itself came from a region or
 *    country centroid, the only such match in the country
 *  - the venue's own website: a single set of map coordinates on the page
 *    (Google Maps embed/link, schema.org geo), skipped for URLs shared by
 *    several venues (chain pages)
 * If OSM and the website disagree by more than CONFLICT_KM the venue counts
 * as unlocated. Venues with no evidence are dropped (standing rule: ~99%
 * accuracy — no guessed locations), except a venue on the same site as a
 * sibling whose shared pin was verified (e.g. a kart track inside a circuit).
 *
 * Nominatim usage policy: max 1 request/second with an identifying
 * User-Agent — enforced by a global throttle. Responses are cached in the
 * OS temp dir so a re-run only fetches what changed.
 *
 * Run: npx tsx data/import/relocate-approximate-venues.ts
 */
import "dotenv/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { GENERIC, distinctive, findSharedPointGroups, norm, tokens } from "./find-approximate-locations";
import type { Listing } from "../../lib/types";

const OUT_FILE = path.join(process.cwd(), "data", "import", "location-fixes.csv");
// Manual audit verdicts that override the automatic ones (slug,action,reason)
// — for OSM matches that pass every check but are still the wrong place.
const OVERRIDES_FILE = path.join(process.cwd(), "data", "import", "location-overrides.csv");
const CACHE_FILE = path.join(os.tmpdir(), "racefinder-nominatim-cache.json");
const NOMINATIM_USER_AGENT = "motorsport-directory-import-script/0.1 (one-time personal use)";
const MIN_REQUEST_GAP_MS = 1100;

const CITY_RADIUS_KM = 50; // venues often sit outside the city they're listed under
const SAME_PIN_KM = 0.2; // evidence this close to the stored pin confirms it
const CONFLICT_KM = 3;
const COUNTRY_CENTROID_KM = 30;
const CITY_CENTROID_KM = 5;

// ---------------------------------------------------------------------------
// HTTP with throttle + cache
// ---------------------------------------------------------------------------
const cache: Record<string, unknown> = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, "utf-8")) : {};
let lastNominatimAt = 0;
let dirty = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function saveCache() {
  writeFileSync(CACHE_FILE, JSON.stringify(cache));
  dirty = 0;
}

async function nominatim(endpoint: "search" | "reverse", params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams({ format: "jsonv2", "accept-language": "en", ...params }).toString();
  const key = `${endpoint}?${qs}`;
  if (key in cache) return cache[key];

  for (let attempt = 0; attempt < 4; attempt++) {
    const wait = lastNominatimAt + MIN_REQUEST_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastNominatimAt = Date.now();
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/${key}`, {
        headers: { "User-Agent": NOMINATIM_USER_AGENT },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      const data = await res.json();
      cache[key] = data;
      if (++dirty >= 20) saveCache();
      return data;
    } catch {
      await sleep(3000 * (attempt + 1));
    }
  }
  throw new Error(`Nominatim failed repeatedly for ${key}`);
}

async function fetchPage(url: string): Promise<string | null> {
  const key = `page:${url}`;
  if (key in cache) return cache[key] as string | null;
  let html: string | null = null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RaceFinder location check)" },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    html = res.ok ? (await res.text()).slice(0, 3_000_000) : null;
  } catch {
    html = null;
  }
  cache[key] = html;
  dirty++;
  return html;
}

// ---------------------------------------------------------------------------
// Geometry + name matching
// ---------------------------------------------------------------------------
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

function tokenIn(token: string, haystackTokens: Set<string>, haystackJoined: string): boolean {
  return haystackTokens.has(token) || (token.length >= 4 && haystackJoined.includes(token));
}

interface NominatimResult {
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  name?: string;
  display_name?: string;
  namedetails?: Record<string, string> | null;
  address?: Record<string, string>;
}

// Feature kinds a racing venue never is. Loose queries ("Biwako", "ORC",
// "Rex") otherwise match a lake, a hospital, a school with the same word.
const REJECTED_CATEGORIES = new Set([
  "place", "boundary", "railway", "waterway", "water", "natural", "route", "public_transport", "aeroway",
  "bridge", "information", "historic", "man_made", "office", "junction",
]);
const REJECTED_TYPES: Record<string, Set<string>> = {
  amenity: new Set(["school", "hospital", "clinic", "college", "university", "kindergarten", "place_of_worship", "cafe"]),
  landuse: new Set(["residential", "farmyard", "farmland", "industrial"]),
  building: new Set(["apartments", "residential", "house", "construction", "church"]),
  leisure: new Set(["park", "garden", "nature_reserve"]),
  tourism: new Set(["hotel", "museum", "guest_house", "apartment", "artwork", "information", "viewpoint"]),
};

function isVenueFeature(r: NominatimResult): boolean {
  const category = r.category ?? "";
  const type = r.type ?? "";
  if (REJECTED_CATEGORIES.has(category)) return false;
  if (REJECTED_TYPES[category]?.has(type)) return false;
  if (category === "highway" && type !== "raceway") return false;
  // A kart track can sit inside a mall, not inside an ordinary shop.
  if (category === "shop" && type !== "mall" && type !== "department_store") return false;
  return true;
}

// ---------------------------------------------------------------------------
// Evidence
// ---------------------------------------------------------------------------
interface Evidence extends Point {
  source: string;
  detail: string;
}

interface Anchor {
  // null when the stored city can't be trusted (it came from a region or
  // country centroid), so matches are accepted anywhere in the country.
  city: Point | null;
}

async function searchNominatim(q: string, countryCode: string): Promise<NominatimResult[]> {
  const params: Record<string, string> = { q, limit: "10", addressdetails: "1", namedetails: "1" };
  if (/^[A-Z]{2}$/.test(countryCode) && countryCode !== "XX") params.countrycodes = countryCode.toLowerCase();
  const data = await nominatim("search", params);
  return Array.isArray(data) ? (data as NominatimResult[]) : [];
}

// Splits "Adrenalina Rio Kart — Shopping Jardim Guadalupe" / "F1 Drive at
// Grand Prix Plaza" into the brand and the host site it sits in.
function hostSite(name: string): string | null {
  const m = name.match(/\s(?:—|–|-|@|at)\s(.+)$/i);
  return m ? m[1].replace(/[()]/g, "").trim() : null;
}

function nameMatch(queryName: string, exclude: Set<string>, r: NominatimResult): boolean {
  const want = distinctive(queryName, exclude);
  const names = [r.name ?? "", ...Object.values(r.namedetails ?? {})].filter(Boolean);
  if (names.length === 0) return false;
  const nameTokens = new Set(names.flatMap(tokens));
  const nameJoined = names.map((n) => tokens(n).join("")).join("|");
  if (want.length === 0) {
    // Nothing but generic words ("Karting Center"): only an exact name counts.
    return names.some((n) => norm(n) === norm(queryName));
  }
  const fullTokens = new Set([...nameTokens, ...tokens(r.display_name ?? "")]);
  const fullJoined = nameJoined + "|" + tokens(r.display_name ?? "").join("");
  const inName = want.filter((t) => tokenIn(t, nameTokens, nameJoined)).length;
  const covered = want.filter((t) => tokenIn(t, fullTokens, fullJoined)).length;
  if (inName < 1 || covered / want.length < 0.75) return false;
  // One shared word alone ("Capital", "GT", "Lounge") is too weak unless the
  // feature is itself a motorsport place or is the exact name.
  return (
    inName >= 2 ||
    names.some((n) => MOTORSPORT_WORD.test(norm(n))) ||
    names.some((n) => norm(n) === norm(queryName))
  );
}

// For a host mall ("— Shopping Paragem") the mall's name is what should match.
function nameMatchLoose(queryName: string, exclude: Set<string>, r: NominatimResult): boolean {
  const want = distinctive(queryName, exclude);
  const names = [r.name ?? "", ...Object.values(r.namedetails ?? {})].filter(Boolean);
  const nameTokens = new Set(names.flatMap(tokens));
  const nameJoined = names.map((n) => tokens(n).join("")).join("|");
  return want.length > 0 && want.every((t) => tokenIn(t, nameTokens, nameJoined));
}

const MOTORSPORT_WORD =
  /kart|race|racing|raceway|circuit|circuito|speed|motor|automobil|autodrom|ring|track|pista|piste|grand prix|sim|simracing|teamsport/;

// Nominatim only returns features matching *every* query word, and OSM names
// rarely match a listing's wording exactly ("TeamSport Go Karting Docklands"
// is "Teamsport London Docklands" in OSM), so try progressively looser
// queries. Looser queries are safe because every hit still has to pass
// nameMatch against the full venue name, plus the city/ambiguity checks.
function queryVariants(v: Listing, anchor: Anchor, exclude: Set<string>): { q: string; matchName: string }[] {
  const bases: { q: string; matchName: string }[] = [];
  const add = (q: string, matchName = v.name) => {
    q = q.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
    if (q && !bases.some((b) => b.q === q)) bases.push({ q, matchName });
  };
  const words = v.name.split(/\s+/);
  const isDistinctive = (w: string) => tokens(w).some((t) => !GENERIC.has(t) && !exclude.has(t));
  add(v.name);
  add(words.filter((w) => !tokens(w).every((t) => exclude.has(t))).join(" "));
  add(words.filter(isDistinctive).join(" "));
  for (let n = words.length - 1; n >= 2; n--) {
    const prefix = words.slice(0, n);
    if (prefix.some(isDistinctive)) add(prefix.join(" ").replace(/[\s—–\-@,]+$/, ""));
  }
  const host = hostSite(v.name);
  if (host && distinctive(host, exclude).length > 0) {
    add(host, host);
    const brand = v.name.slice(0, v.name.length - host.length).replace(/\s(?:—|–|-|@|at)\s*$/i, "").trim();
    if (brand) add(brand);
  }
  // With a trusted city, "<query>, <city>" first: chains ("K1 Speed") return
  // other cities' branches first otherwise and fill up the result limit.
  return bases.flatMap((b) => (anchor.city && v.city ? [{ ...b, q: `${b.q}, ${v.city}` }, b] : [b]));
}

async function osmEvidence(v: Listing, anchor: Anchor, exclude: Set<string>): Promise<{ ev: Evidence | null; note: string }> {
  let ambiguous = 0;
  for (const { q, matchName } of queryVariants(v, anchor, exclude)) {
    const hits: { p: Point; r: NominatimResult }[] = [];
    for (const r of await searchNominatim(q, v.countryCode)) {
      const hostMall = matchName !== v.name && r.category === "shop";
      if (!isVenueFeature(r)) continue;
      if (!nameMatch(matchName, exclude, r) && !(hostMall && nameMatchLoose(matchName, exclude, r))) continue;
      const p = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
      if (anchor.city && km(p, anchor.city) > CITY_RADIUS_KM) continue;
      hits.push({ p, r });
    }
    if (hits.length === 0) continue;
    // Several matches far apart = a chain with several branches, or a
    // same-named place elsewhere: can't tell which one this listing is.
    const first = hits[0];
    if (hits.some((h) => km(h.p, first.p) > 2)) {
      ambiguous = hits.length;
      break;
    }
    return { ev: { ...first.p, source: "osm", detail: `${first.r.category}/${first.r.type} "${first.r.name}" (query "${q}")` }, note: "" };
  }
  return { ev: null, note: ambiguous ? `ambiguous OSM matches (${ambiguous})` : "no OSM match" };
}

const COORD_PATTERNS: { re: RegExp; order: "latlng" | "lnglat" }[] = [
  { re: /!3d(-?\d{1,2}\.\d{4,})!4d(-?\d{1,3}\.\d{4,})/g, order: "latlng" },
  { re: /!2d(-?\d{1,3}\.\d{4,})!3d(-?\d{1,2}\.\d{4,})/g, order: "lnglat" },
  { re: /maps[^"'\s]*@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/g, order: "latlng" },
  { re: /[?&;](?:ll|q|center|daddr|destination|query)=(-?\d{1,2}\.\d{4,})(?:,|%2C)\s*(-?\d{1,3}\.\d{4,})/g, order: "latlng" },
  { re: /"latitude"\s*:\s*"?(-?\d{1,2}\.\d{4,})"?\s*,\s*"longitude"\s*:\s*"?(-?\d{1,3}\.\d{4,})/g, order: "latlng" },
  { re: /data-lat(?:itude)?=["'](-?\d{1,2}\.\d{4,})["'][^>]*data-(?:lng|lon|longitude)=["'](-?\d{1,3}\.\d{4,})/g, order: "latlng" },
];

async function websiteEvidence(v: Listing, sharedUrls: Set<string>): Promise<{ ev: Evidence | null; note: string }> {
  const url = v.websiteUrl;
  if (!url) return { ev: null, note: "" };
  if (/instagram\.com|facebook\.com|tiktok\.com|linktr\.ee/i.test(url)) return { ev: null, note: "social-only website" };
  if (sharedUrls.has(url)) return { ev: null, note: "website shared by several venues" };
  const html = await fetchPage(url);
  if (!html) return { ev: null, note: "website unreachable" };

  const points: Point[] = [];
  for (const { re, order } of COORD_PATTERNS) {
    for (const m of html.matchAll(re)) {
      const a = parseFloat(m[1]);
      const b = parseFloat(m[2]);
      const p = order === "latlng" ? { lat: a, lng: b } : { lat: b, lng: a };
      if (Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180 && !(p.lat === 0 && p.lng === 0)) points.push(p);
    }
  }
  if (points.length === 0) return { ev: null, note: "no coordinates on website" };
  if (points.some((p) => km(p, points[0]) > 1)) return { ev: null, note: "several locations on website" };
  return { ev: { ...points[0], source: "website", detail: url }, note: "" };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
interface Verdict {
  venue: Listing;
  point: string;
  action: "keep" | "fix" | "drop";
  lat?: number;
  lng?: number;
  address?: string;
  city?: string;
  source: string;
  evidence: string;
}

async function geocodeCentroid(q: string, countryCode: string): Promise<Point | null> {
  const results = await searchNominatim(q, countryCode);
  const r = results.find((x) => x.category === "place" || x.category === "boundary") ?? results[0];
  return r ? { lat: parseFloat(r.lat), lng: parseFloat(r.lon) } : null;
}

async function main() {
  const { all, groups } = await findSharedPointGroups();
  const suspects = groups.flatMap((g) => g.venues.map((venue) => ({ venue, group: g })));
  console.log(`${suspects.length} venues share a point with another venue (${groups.length} points).`);

  const urlCounts = new Map<string, number>();
  for (const l of all) if (l.websiteUrl) urlCounts.set(l.websiteUrl, (urlCounts.get(l.websiteUrl) ?? 0) + 1);
  const sharedUrls = new Set([...urlCounts].filter(([, n]) => n > 1).map(([u]) => u));

  // Is each shared pin a city centroid (stored city is right, pin isn't) or
  // a region/country centroid (stored city came from the bad pin too)?
  const anchors = new Map<string, Anchor>();
  for (const g of groups) {
    const v = g.venues[0];
    const country = await geocodeCentroid(v.country, v.countryCode);
    const atCountryCentre = country !== null && km(country, g) < COUNTRY_CENTROID_KM;
    let city: Point | null = null;
    if (v.city && !atCountryCentre) {
      const c = await geocodeCentroid(`${v.city}, ${v.country}`, v.countryCode);
      if (c && km(c, g) < CITY_CENTROID_KM) city = c;
      else if (c && g.venues.every((x) => x.city === v.city)) {
        // Pin isn't the city centre, but might still be inside the city
        // (a named street/landmark fallback): trust the city if close.
        city = km(c, g) < CITY_RADIUS_KM / 2 ? c : null;
      }
    }
    anchors.set(g.key, { city });
  }

  const verdicts: Verdict[] = [];
  let i = 0;
  for (const { venue: v, group } of suspects) {
    i++;
    process.stdout.write(`[${i}/${suspects.length}] ${v.name} (${v.city || "?"}, ${v.country})... `);
    const anchor = anchors.get(group.key)!;
    const exclude = new Set([...tokens(v.city), ...tokens(v.country)]);
    const osm = await osmEvidence(v, anchor, exclude);
    const web = await websiteEvidence(v, sharedUrls);
    const notes = [osm.note, web.note].filter(Boolean).join("; ");

    let ev: Evidence | null = null;
    let conflict = false;
    if (osm.ev && web.ev) {
      if (km(osm.ev, web.ev) > CONFLICT_KM) conflict = true;
      else ev = web.ev; // a map embed marks the entrance; an OSM centroid can be mid-track
    } else {
      ev = osm.ev ?? web.ev;
    }
    // Website coordinates far from a trusted city are an HQ/another branch.
    if (ev && ev.source === "website" && anchor.city && km(ev, anchor.city) > CITY_RADIUS_KM) ev = null;

    if (conflict) {
      verdicts.push({ venue: v, point: group.key, action: "drop", source: "", evidence: `OSM and website disagree by ${km(osm.ev!, web.ev!).toFixed(1)} km` });
      console.log("conflict -> drop");
    } else if (!ev) {
      verdicts.push({ venue: v, point: group.key, action: "drop", source: "", evidence: notes || "no evidence" });
      console.log(`unlocated (${notes || "no evidence"})`);
    } else if (km(ev, group) <= SAME_PIN_KM) {
      verdicts.push({ venue: v, point: group.key, action: "keep", lat: v.lat, lng: v.lng, source: ev.source, evidence: ev.detail });
      console.log(`pin confirmed by ${ev.source}`);
    } else {
      verdicts.push({ venue: v, point: group.key, action: "fix", lat: ev.lat, lng: ev.lng, source: ev.source, evidence: ev.detail });
      console.log(`moved ${km(ev, group).toFixed(1)} km by ${ev.source}`);
    }
  }

  // Same-site siblings: an unlocated venue sharing a distinctive name word
  // with a venue whose pin at this very point was confirmed (Kyalami Grand
  // Prix Circuit / Kyalami Indoor Karting).
  for (const d of verdicts.filter((x) => x.action === "drop")) {
    const exclude = new Set([...tokens(d.venue.city), ...tokens(d.venue.country)]);
    const mine = new Set(distinctive(d.venue.name, exclude));
    const sibling = verdicts.find(
      (x) =>
        x.point === d.point &&
        x.action === "keep" &&
        distinctive(x.venue.name, exclude).some((t) => mine.has(t))
    );
    if (sibling) {
      Object.assign(d, { action: "keep", lat: d.venue.lat, lng: d.venue.lng, source: "same-site", evidence: `shares the verified site of ${sibling.venue.name}` });
    }
  }

  // Two unrelated venues moved onto the same spot means at least one OSM
  // match was wrong — don't trust either.
  const moved = verdicts.filter((x) => x.action === "fix" || x.action === "keep");
  for (const a of moved) {
    for (const b of moved) {
      if (a === b || a.action === "drop" || km(a as Point, b as Point) > 0.05) continue;
      const ex = new Set([...tokens(a.venue.city), ...tokens(a.venue.country)]);
      const ta = new Set(distinctive(a.venue.name, ex));
      if (distinctive(b.venue.name, ex).some((t) => ta.has(t))) continue;
      if (a.source === "same-site" || b.source === "same-site") continue;
      for (const x of [a, b]) {
        if (x.action !== "fix") continue;
        Object.assign(x, { action: "drop", evidence: `matched the same spot as unrelated venue ${x === a ? b.venue.name : a.venue.name}` });
      }
    }
  }

  if (existsSync(OVERRIDES_FILE)) {
    const overrides = parse(readFileSync(OVERRIDES_FILE, "utf-8"), { columns: true, skip_empty_lines: true }) as {
      slug: string;
      action: string;
      reason: string;
    }[];
    for (const o of overrides) {
      const x = verdicts.find((v) => v.venue.slug === o.slug);
      if (x && o.action === "drop") Object.assign(x, { action: "drop", source: "audit", evidence: `audit: ${o.reason}` });
    }
  }

  // Fresh address/city for moved pins, from the new point (as the import does).
  for (const f of verdicts.filter((x) => x.action === "fix")) {
    const rev = (await nominatim("reverse", { lat: String(f.lat), lon: String(f.lng) })) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    const a = rev.address ?? {};
    const cc = (a.country_code ?? "").toUpperCase();
    if (cc && f.venue.countryCode !== "XX" && cc !== f.venue.countryCode) {
      Object.assign(f, { action: "drop", evidence: `${f.evidence}; new point is in ${cc}, not ${f.venue.countryCode}` });
      continue;
    }
    f.address = rev.display_name ?? "";
    // Keep the listed city (it's what city pages and search use) unless the
    // pin moved so far that the city itself came from the bad centroid.
    const movedKm = km(f as Point, f.venue);
    if (f.venue.city && movedKm <= CITY_RADIUS_KM) {
      f.city = f.venue.city;
    } else {
      const raw = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
      f.city = raw.replace(/^(Town|City|Village) of /i, "").replace(/ (Municipal Council|City Council|Division|Tehsil)$/i, "").trim() || f.venue.city;
    }
  }
  saveCache();

  const rows = verdicts.map((x) => ({
    slug: x.venue.slug,
    action: x.action,
    lat: x.action === "drop" ? "" : x.lat!.toFixed(6),
    lng: x.action === "drop" ? "" : x.lng!.toFixed(6),
    address: x.action === "fix" ? x.address : "",
    city: x.action === "fix" ? x.city : "",
    source: x.source,
    evidence: x.evidence,
    name: x.venue.name,
    country: x.venue.country,
    oldLat: x.venue.lat,
    oldLng: x.venue.lng,
    oldCity: x.venue.city,
  }));
  writeFileSync(OUT_FILE, stringify(rows, { header: true }));

  const count = (a: string) => verdicts.filter((x) => x.action === a).length;
  console.log(`\nKept (pin verified): ${count("keep")}`);
  console.log(`Fixed (moved):       ${count("fix")}`);
  console.log(`Dropped (unlocated): ${count("drop")}`);
  console.log(`Wrote ${rows.length} rows to ${OUT_FILE}`);
}

main()
  .catch((err) => {
    saveCache();
    throw err;
  })
  .then(() => process.exit(0));
