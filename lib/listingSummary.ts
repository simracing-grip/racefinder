import type { Listing, ListingSummary } from "@/lib/types";
import { getNextEvent } from "@/lib/listingSort";

// ~1 m precision is plenty for a pin; full floats add bytes on every venue.
const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

// Server-side: shrink a Listing to what list/map/search UIs need before it's
// passed to a client component. Optional keys are only set when present —
// React serializes an explicit `undefined` as "$undefined", which across
// 3,500 venues adds up.
export function toSummary(listing: Listing): ListingSummary {
  const summary: ListingSummary = {
    slug: listing.slug,
    name: listing.name,
    categories: listing.categories,
    country: listing.country,
    countryCode: listing.countryCode,
    city: listing.city,
    lat: round5(listing.lat),
    lng: round5(listing.lng),
  };
  if (listing.coverImageUrl) summary.coverImageUrl = listing.coverImageUrl;
  if (listing.featured) summary.featured = true;
  // Shown as small tags on list rows ("Indoor · Electric · 1,200 m").
  if (listing.indoorOutdoor) summary.indoorOutdoor = listing.indoorOutdoor;
  if (listing.trackLengthM) summary.trackLengthM = listing.trackLengthM;
  if (listing.details?.karting?.kart_type) summary.kartType = listing.details.karting.kart_type;
  const next = getNextEvent(listing);
  if (next) {
    // Rows only show name + date; sort needs the dates. Drop sourceUrl etc.
    const { series, name, startDate, endDate, season } = next;
    summary.events = [endDate ? { series, name, startDate, endDate, season } : { series, name, startDate, season }];
  }
  return summary;
}

export function toSummaries(listings: Listing[]): ListingSummary[] {
  return listings.map(toSummary);
}
