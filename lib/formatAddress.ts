import type { Listing } from "@/lib/types";

// Raw addresses come from reverse-geocoding (see data/import/) and arrive as
// a flat comma-separated chain of OSM components: sometimes a leaked nearby
// POI/business name up front, then house number + street, then several
// layers of neighbourhood/district/region, then postal code, then country.
// That's too noisy to show as-is (see e.g. "Norfos vaistinė, 1B, Parodų g.,
// Miškiniai, Lazdynai eldership, Vilnius, Vilnius city municipality, Vilnius
// County, 04133, Lithuania" for what's really just a street in Vilnius).
// This reduces it to "<street>, <city>, <country>" using the Listing's own
// trusted city/country fields rather than trying to parse them back out of
// the messy string.
const STREET_WORD_RE =
  /\b(street|st\.?|road|rd\.?|avenue|ave\.?|drive|dr\.?|boulevard|blvd\.?|lane|ln\.?|way|highway|hwy\.?|route|rte\.?|circuit|track|gatvė|gatve|g\.|iela|prospekt|straat|strasse|straße|str\.?|rue|via|viale|ulica|ulitsa|utca|út|tér|cesta|улица|ул\.?|проспект|шоссе|pargi|park|plein|platz|allee|weg|gasse)\b/i;

function looksStreetLike(part: string): boolean {
  return /\d/.test(part) || STREET_WORD_RE.test(part);
}

export function formatAddress(listing: Pick<Listing, "address" | "city" | "country" | "name">): string {
  const parts = listing.address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cityIdx = parts.findIndex((p) => p.toLowerCase() === listing.city.toLowerCase());
  let prefix = cityIdx > 0 ? parts.slice(0, cityIdx) : parts.slice(0, Math.max(1, parts.length - 3));

  // Drop a leading component that's either the venue's own name repeated
  // (redundant — it's already the page title) or an unrelated POI picked up
  // by the geocoder, recognizable by not looking street-like itself while
  // the component right after it does (a strong signal that's a house
  // number/street, not more of the business name).
  if (prefix.length >= 2) {
    const [first, second] = prefix;
    const firstMatchesName = first.toLowerCase() === listing.name.toLowerCase();
    const firstLooksLikePoi = !looksStreetLike(first) && looksStreetLike(second);
    if (firstMatchesName || firstLooksLikePoi) {
      prefix = prefix.slice(1);
    }
  }

  // Guard against the city/country also showing up inside the prefix (e.g.
  // when the raw address has no real street and the city is itself the
  // first token) — that would otherwise duplicate it in the output.
  const deduped = prefix.filter(
    (p) => p.toLowerCase() !== listing.city.toLowerCase() && p.toLowerCase() !== listing.country.toLowerCase()
  );

  // Cap how much of the admin-region chain (district/county/state) survives
  // when it doesn't happen to match the city field exactly.
  const capped = deduped.length > 3 ? deduped.slice(0, 3) : deduped;

  const street = capped.join(", ");
  return [street, listing.city, listing.country].filter(Boolean).join(", ");
}

// Every listing has lat/lng (from geocoding at import time), so this always
// resolves to an exact pin — no dependence on the raw address text being
// parseable by Google, and no per-listing googleMapsUrl data needed.
export function googleMapsUrl(listing: Pick<Listing, "lat" | "lng">): string {
  return `https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`;
}
