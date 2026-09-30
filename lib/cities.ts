import slugify from "slugify";
import type { Category, Listing } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CITY_CENTRES, type CityCentre } from "@/data/cities";
import { getListings } from "@/lib/listings";
import { slugifyCountry } from "@/lib/countrySlug";
import { distanceKm } from "@/lib/geo";

// "Places to race near {city}" pages (/country/[country]/[city]): every
// venue within CITY_RADIUS_KM of a well-known city's centre (data/cities.ts).
// A city only gets a page with at least MIN_VENUES in range — thinner pages
// would be the kind of near-empty location page search engines demote — and
// of two qualifying cities closer than MERGE_KM, only the one listed first
// in data/cities.ts gets a page (e.g. Rotterdam, not The Hague), since
// they'd show almost the same venues.
export const CITY_RADIUS_KM = 50;
const MIN_VENUES = 5;
const MERGE_KM = 25;

export interface CityHub extends CityCentre {
  slug: string;
  countrySlug: string;
  venueCount: number;
}

export interface NearbyVenue {
  listing: Listing;
  km: number;
}

export function citySlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

function venuesWithin(listings: Listing[], centre: { lat: number; lng: number }): NearbyVenue[] {
  return listings
    .map((listing) => ({ listing, km: distanceKm(centre, listing) }))
    .filter((v) => v.km <= CITY_RADIUS_KM)
    .sort((a, b) => a.km - b.km);
}

// ~240 cities x ~3,500 venues is a few tens of ms, so it's memoised for the
// same 5 minutes the listings themselves are cached (lib/listings.ts).
const MEMO_MS = 5 * 60 * 1000;
let memo: { at: number; hubs: CityHub[] } | null = null;

export async function getCityHubs(): Promise<CityHub[]> {
  if (memo && Date.now() - memo.at < MEMO_MS) return memo.hubs;
  const listings = await getListings();

  const hubs: CityHub[] = [];
  for (const city of CITY_CENTRES) {
    const venueCount = venuesWithin(listings, city).length;
    if (venueCount < MIN_VENUES) continue;
    if (hubs.some((h) => distanceKm(h, city) < MERGE_KM)) continue;
    hubs.push({ ...city, slug: citySlug(city.name), countrySlug: slugifyCountry(city.country), venueCount });
  }
  memo = { at: Date.now(), hubs };
  return hubs;
}

export async function getCityHub(countrySlug: string, slug: string): Promise<CityHub | undefined> {
  return (await getCityHubs()).find((h) => h.countrySlug === countrySlug && h.slug === slug);
}

export async function getVenuesNear(hub: CityHub): Promise<NearbyVenue[]> {
  return venuesWithin(await getListings(), hub);
}

export function categoryBreakdown(listings: Listing[]): { value: Category; label: string; plural: string; count: number }[] {
  return CATEGORIES.map((c) => ({ ...c, count: listings.filter((l) => l.categories.includes(c.value)).length })).filter(
    (c) => c.count > 0
  );
}
