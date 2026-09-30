import type { Category, Listing } from "@/lib/types";
import { getListings, getCountries } from "@/lib/listings";
import { getCityHubs } from "@/lib/cities";
import { slugifyCountry } from "@/lib/countrySlug";
import { getNextEvent } from "@/lib/listingSort";

// Site search (header palette + home hero), served by /api/search from the
// in-memory listings cache so pages don't ship the whole directory.

export type SearchResult =
  | {
      type: "venue";
      href: string;
      name: string;
      city: string;
      country: string;
      countryCode: string;
      category: Category;
    }
  | { type: "city"; href: string; name: string; country: string; count: number }
  | { type: "country"; href: string; name: string; countryCode?: string; count: number };

// Accent- and case-insensitive: "nurburg" finds "Nürburgring".
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function words(s: string): string[] {
  return normalize(s).split(/[^a-z0-9]+/).filter(Boolean);
}

const startsAWord = (qWords: string[], hayWords: string[]) =>
  qWords.every((w) => hayWords.some((hw) => hw.startsWith(w)));

// Tiers, highest first:
//  1. every query word starts a word of the venue's name (40–50), plus a
//     prominence boost — so "monza" puts Autodromo Nazionale Monza (F1, races
//     coming up, photo) above a kart track called just "Monza";
//  2. words start a word of the name, city or country (10–27; the boost is
//     damped so a location match never outranks a name match);
//  3. last resort, a match inside a word ("zz" in "Dezzi"), no boost.
// Returns null when a query word isn't found at all.
function scoreVenue(l: Listing, q: string, qWords: string[]): number | null {
  const name = normalize(l.name);
  const hay = `${name} ${normalize(l.city)} ${normalize(l.country)}`;
  if (!qWords.every((w) => hay.includes(w))) return null;

  const boost =
    (l.categories.includes("f1") ? 30 : l.categories.includes("track_day") ? 12 : 0) +
    (getNextEvent(l) ? 10 : 0) +
    (l.coverImageUrl ? 6 : 0);
  const tiebreak = name.length * 0.01; // shorter name wins a tie

  if (startsAWord(qWords, words(l.name))) {
    return (name === q ? 50 : name.startsWith(q) ? 45 : 40) + boost - tiebreak;
  }
  if (startsAWord(qWords, words(hay))) return 10 + boost * 0.3 - tiebreak;
  return -tiebreak;
}

// Places rank on the same scale: above a plain name match, below a famous
// circuit ("spa" → Spa-Francorchamps, then Spain).
const PLACE_SCORE = 60;

export async function search(query: string, limit = 8): Promise<SearchResult[]> {
  const q = normalize(query).trim();
  const qWords = words(query);
  if (q.length < 2 || qWords.length === 0) return [];

  const [listings, countries, hubs] = await Promise.all([getListings(), getCountries(), getCityHubs()]);

  // Places: only prefix matches ("lon" → London, "ita" → Italy), at most two.
  const places: { score: number; result: SearchResult }[] = [];
  for (const h of hubs) {
    if (normalize(h.name).startsWith(q)) {
      places.push({
        score: PLACE_SCORE + (normalize(h.name) === q ? 30 : 0) + h.venueCount * 0.01,
        result: { type: "city", href: `/country/${h.countrySlug}/${h.slug}`, name: h.name, country: h.country, count: h.venueCount },
      });
    }
  }
  for (const c of countries) {
    if (normalize(c).startsWith(q)) {
      const inCountry = listings.filter((l) => l.country === c);
      places.push({
        score: PLACE_SCORE + (normalize(c) === q ? 30 : 0) + inCountry.length * 0.01,
        result: { type: "country", href: `/country/${slugifyCountry(c)}`, name: c, countryCode: inCountry[0]?.countryCode, count: inCountry.length },
      });
    }
  }
  const topPlaces = places.sort((a, b) => b.score - a.score).slice(0, 2);

  const venues = listings
    .map((l) => ({ l, score: scoreVenue(l, q, qWords) }))
    .filter((x): x is { l: Listing; score: number } => x.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ l, score }) => ({
      score,
      result: {
        type: "venue",
        href: `/listings/${l.slug}`,
        name: l.name,
        city: l.city,
        country: l.country,
        countryCode: l.countryCode,
        category: l.categories[0],
      } satisfies SearchResult,
    }));

  return [...topPlaces, ...venues]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.result);
}
