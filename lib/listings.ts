import type { Category, Listing } from "@/lib/types";
import { generatedListings } from "@/data/generated-listings";
import { CALENDAR_EVENTS } from "@/data/calendar-events";

// Backed by data/generated-listings.ts (produced from your real Google Maps
// data via the import pipeline — see README). Once Supabase is connected,
// swap the bodies of these functions for Drizzle queries against
// lib/db/schema.ts — nothing that calls this module needs to change.
//
// Race-calendar dates (data/calendar-events.ts — also the source for the
// site's /calendar tab) are merged in here by matching listingSlug, rather
// than baked into generated-listings.ts, since they're maintained on a
// different cadence than venue location data.
function withEvents(listing: Listing): Listing {
  const events = CALENDAR_EVENTS.filter((e) => e.listingSlug === listing.slug);
  return events.length > 0 ? { ...listing, events } : listing;
}

const allListings = generatedListings.map(withEvents);

export interface ListingFilters {
  category?: Category;
  country?: string;
  city?: string;
  indoorOutdoor?: string;
}

export async function getListings(filters: ListingFilters = {}): Promise<Listing[]> {
  let results = allListings.filter((l) => l.status === "published");

  if (filters.category) {
    results = results.filter((l) => l.categories.includes(filters.category!));
  }
  if (filters.country) {
    results = results.filter(
      (l) => l.country.toLowerCase() === filters.country!.toLowerCase()
    );
  }
  if (filters.city) {
    results = results.filter(
      (l) => l.city.toLowerCase() === filters.city!.toLowerCase()
    );
  }
  if (filters.indoorOutdoor) {
    results = results.filter((l) => l.indoorOutdoor === filters.indoorOutdoor);
  }

  return results;
}

// Soonest-upcoming-event first, so venues hosting a race soon surface at the
// top of the homepage list; venues with no upcoming event sort after those
// that have one, keeping their relative order otherwise (Array#sort is
// stable).
export function sortByUpcomingEvent(listings: Listing[]): Listing[] {
  const today = new Date().toISOString().slice(0, 10);
  const nextEventDate = (listing: Listing) =>
    (listing.events ?? [])
      .filter((e) => (e.endDate ?? e.startDate) >= today)
      .map((e) => e.startDate)
      .sort()[0];

  return [...listings].sort((a, b) => {
    const dateA = nextEventDate(a);
    const dateB = nextEventDate(b);
    if (dateA && dateB) return dateA.localeCompare(dateB);
    if (dateA) return -1;
    if (dateB) return 1;
    return 0;
  });
}

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  return allListings.find((l) => l.slug === slug && l.status === "published");
}

export async function getCountries(): Promise<string[]> {
  const countries = new Set(allListings.map((l) => l.country));
  return Array.from(countries).sort();
}

// Country name -> ISO code, for pages that only have the name (e.g. the
// /country/[country] route param) and need it to render a flag.
export async function getCountryCode(countryName: string): Promise<string | undefined> {
  return allListings.find(
    (l) => l.country.toLowerCase() === countryName.toLowerCase()
  )?.countryCode;
}
