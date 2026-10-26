/**
 * Lists published venues whose coordinates (rounded to 4 decimals, ~11 m)
 * are shared with at least one other venue, grouped by point, and flags the
 * groups that look like geocoding fallbacks (a city/region centroid or a
 * landmark) rather than real venue locations:
 *  - 3+ venues on one point, or
 *  - the shared address is a landmark/centroid ("Central Point of London
 *    Plaque", a bare "City, Region, Country" with no street), or
 *  - the venues sharing it have different addresses (so the pin can't be
 *    right for all of them), or unrelated names (no shared name word)
 *
 * Two venues genuinely on one site (Kyalami Grand Prix Circuit / Kyalami
 * Indoor Karting) share a street address and a name word and aren't flagged
 * here — relocate-approximate-venues.ts still checks every shared pin.
 *
 * Writes data/import/approximate-locations.csv (one row per venue) — the
 * input to relocate-approximate-venues.ts.
 *
 * Run: npx tsx data/import/find-approximate-locations.ts
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import { getListings } from "../../lib/listings";
import type { Listing } from "../../lib/types";

const OUT_FILE = path.join(process.cwd(), "data", "import", "approximate-locations.csv");

// Address text Nominatim returns when a query only resolved to a landmark or
// an administrative area rather than to the venue.
const LANDMARK_PATTERN =
  /\b(central point|plaque|geographic(al)? cent(er|re)|centre of|center of|city cent(er|re)|downtown|statue|monument|cathedral|town hall|city hall|main square)\b/i;

// Street-level words in the languages the directory covers. An address with
// none of these and no digits is almost always "Town, Region, Country".
const STREET_PATTERN =
  /\b(road|rd|street|st|avenue|ave|lane|way|drive|dr|boulevard|blvd|highway|hwy|route|park|circuit|raceway|kart|karting|track|industrial|estate|unit|rue|chemin|allée|zone|zi|za|straße|strasse|str|weg|gasse|platz|allee|via|viale|strada|piazza|località|calle|avenida|carrer|camino|carretera|polígono|rua|estrada|rodovia|ulica|ul|utca|út|ulice|cesta|vej|gatan|gata|väg|vägen|tie|katu|yolu|sokak|cadde|jalan|soi|thanon|street)\b/i;

export type Reason = "3+ venues" | "landmark address" | "no street in address" | "different addresses" | "unrelated names";

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

// Words that say what kind of venue it is rather than which one.
export const GENERIC = new Set(
  (
    "kart karts karting kartodromo kartodrom kartbahn kartcenter gokart gokarts go carts cart raceway speedway circuit circuito " +
    "autodromo autodrom racing race races racer track pista piste indoor outdoor sim simracing simulator simulators simulation " +
    "simulador esports club clube center centre centro arena park parque motor motors motorsport motorsports sport sports sportpark " +
    "the de do da del la le les di das dos e y and et und of at a an int international internacional grand prix gp experience fun " +
    "family entertainment zone world land city ring drive driving school academy pro speed rental hire leisure venue complex " +
    "shopping mall plaza outlet"
  ).split(" ")
);

export function distinctive(name: string, exclude: Set<string>): string[] {
  return [...new Set(tokens(name))].filter((t) => !GENERIC.has(t) && !exclude.has(t) && (t.length > 1 || /\d/.test(t)));
}

export interface ApproxGroup {
  key: string;
  lat: number;
  lng: number;
  venues: Listing[];
  reasons: Reason[];
}

function pointKey(l: Listing): string {
  return `${l.lat.toFixed(4)},${l.lng.toFixed(4)}`;
}

function normAddress(a: string): string {
  return a.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isCentroidLikeAddress(address: string): Reason | null {
  if (LANDMARK_PATTERN.test(address)) return "landmark address";
  if (!/\d/.test(address) && !STREET_PATTERN.test(address)) return "no street in address";
  return null;
}

export async function findSharedPointGroups(): Promise<{ all: Listing[]; groups: ApproxGroup[] }> {
  const all = await getListings();
  const byPoint = new Map<string, Listing[]>();
  for (const l of all) {
    const key = pointKey(l);
    byPoint.set(key, [...(byPoint.get(key) ?? []), l]);
  }

  const groups: ApproxGroup[] = [];
  for (const [key, venues] of byPoint) {
    if (venues.length < 2) continue;
    const reasons = new Set<Reason>();
    if (venues.length >= 3) reasons.add("3+ venues");
    for (const v of venues) {
      const r = isCentroidLikeAddress(v.address);
      if (r) reasons.add(r);
    }
    if (new Set(venues.map((v) => normAddress(v.address))).size > 1) reasons.add("different addresses");
    // Two venues genuinely on one site share a name word ("Kyalami Grand Prix
    // Circuit" / "Kyalami Indoor Karting"); unrelated names on one pin mean a
    // shared fallback, even when the reverse-geocoded address matches.
    const exclude = new Set(venues.flatMap((v) => [...tokens(v.city), ...tokens(v.country)]));
    const [first, ...rest] = venues.map((v) => new Set(distinctive(v.name, exclude)));
    if (rest.some((set) => ![...set].some((t) => first.has(t)))) reasons.add("unrelated names");
    const [lat, lng] = key.split(",").map(Number);
    groups.push({ key, lat, lng, venues, reasons: [...reasons] });
  }
  groups.sort((a, b) => b.venues.length - a.venues.length || a.key.localeCompare(b.key));
  return { all, groups };
}

async function main() {
  const { all, groups } = await findSharedPointGroups();
  const flagged = groups.filter((g) => g.reasons.length > 0);
  const venueCount = groups.reduce((n, g) => n + g.venues.length, 0);
  const flaggedCount = flagged.reduce((n, g) => n + g.venues.length, 0);

  for (const g of groups) {
    const tag = g.reasons.length ? `FLAGGED (${g.reasons.join("; ")})` : "looks legitimate";
    console.log(`\n${g.key} — ${g.venues.length} venues — ${tag}`);
    for (const v of g.venues) console.log(`  - ${v.name} | ${v.city}, ${v.country} | ${v.address}`);
  }

  console.log(`\nPublished venues: ${all.length}`);
  console.log(`Venues sharing a point with another venue: ${venueCount} across ${groups.length} points`);
  console.log(`  flagged as likely approximate: ${flaggedCount} venues across ${flagged.length} points`);
  console.log(`  left alone (shared street address): ${venueCount - flaggedCount} venues`);

  const rows = groups.flatMap((g) =>
    g.venues.map((v) => ({
      point: g.key,
      groupSize: g.venues.length,
      flagged: g.reasons.length > 0 ? "yes" : "no",
      reasons: g.reasons.join("; "),
      slug: v.slug,
      name: v.name,
      city: v.city,
      country: v.country,
      countryCode: v.countryCode,
      address: v.address,
      websiteUrl: v.websiteUrl ?? "",
      googleMapsUrl: v.googleMapsUrl ?? "",
    }))
  );
  writeFileSync(OUT_FILE, stringify(rows, { header: true }));
  console.log(`Wrote ${rows.length} rows to ${OUT_FILE}`);
}

// Only run when executed directly, so relocate-approximate-venues.ts can
// import findSharedPointGroups.
if (process.argv[1]?.replace(/\\/g, "/").endsWith("find-approximate-locations.ts")) {
  main().then(() => process.exit(0));
}
