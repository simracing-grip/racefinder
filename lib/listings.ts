import type { Category, Listing } from "@/lib/types";
import { generatedListings } from "@/data/generated-listings";

// Backed by data/generated-listings.ts (produced from your real Google Maps
// data via the import pipeline — see README). Once Supabase is connected,
// swap the bodies of these functions for Drizzle queries against
// lib/db/schema.ts — nothing that calls this module needs to change.
const allListings = generatedListings;

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

export async function getListingBySlug(slug: string): Promise<Listing | undefined> {
  return allListings.find((l) => l.slug === slug && l.status === "published");
}

export async function getCountries(): Promise<string[]> {
  const countries = new Set(allListings.map((l) => l.country));
  return Array.from(countries).sort();
}
