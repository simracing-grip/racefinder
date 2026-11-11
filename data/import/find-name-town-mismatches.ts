/**
 * Lists venues whose name contains a town (any city used by another listing)
 * that their own address and city don't mention. Most hits are suburbs
 * ("K1 Speed Boston" in Wilmington), but this is how the 2026-11-11 run
 * caught pins the geocoder put in a same-named place far away: Circuit
 * Bugatti on "Route du Mans" near Angers, Speed Park Le Mans in the other
 * Saint-Saturnin, Mores and Abruzzo 20-30 km off. find-misplaced-pins.ts
 * doesn't see these, because the pin isn't on a town hall or square.
 *
 * Read-only. Check each hit by hand (OSM, the venue's site) and fix real
 * ones through location-fixes.csv.
 *
 * Run: npx tsx data/import/find-name-town-mismatches.ts
 */
import { readFileSync } from "node:fs";
import type { Listing } from "../../lib/types";

const listings: Listing[] = JSON.parse(readFileSync("data/generated-listings.json", "utf-8"));
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Town names that are also everyday words or common in venue names.
const IGNORE = new Set([
  "karting", "circuit", "racing", "speedway", "raceway", "motorsport", "indoor", "center", "centre",
  "international", "sports", "sport", "park", "track", "arena", "club", "village", "valley", "beach",
  "springs", "central", "north", "south", "east", "west", "grand", "green", "river", "speed", "victoria",
  "florida", "georgia", "paradise", "eagle", "phoenix", "jackson", "franklin", "lincoln", "washington",
  "madison", "clinton", "marion", "milton", "newport", "richmond", "warwick", "kingston",
]);

const towns = [...new Set(listings.map((l) => norm(l.city)).filter((c) => c.length >= 5 && !IGNORE.has(c)))].map(
  (town) => [town, new RegExp(`(^|[^a-z])${escape(town)}($|[^a-z])`)] as const,
);

let hits = 0;
for (const l of listings) {
  const name = norm(l.name);
  const where = norm(`${l.address} ${l.city}`);
  const town = towns.find(([t, re]) => re.test(name) && !where.includes(t));
  if (town) {
    hits++;
    console.log(`${l.slug} | ${l.name} | city ${l.city}, ${l.country} | name has "${town[0]}" | ${l.lat},${l.lng}`);
  }
}
console.log(`\n${hits} venues to look at.`);
