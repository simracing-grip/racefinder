import type { Listing } from "@/lib/types";

// True when a venue page has something beyond its name, address and map:
// a way to contact or book (website, phone, email, social profile), a photo,
// a description, track details, opening hours or upcoming races.
//
// About 2,000 venues have none of these yet. Their pages stay on the site
// (and linked from the country and city pages), but are kept out of search
// engines (noindex + left out of the sitemap): thousands of near-empty pages
// can drag down how search engines rate the whole site. A venue becomes
// indexable as soon as any of these fields is filled in.
export function hasEnoughDetail(listing: Listing): boolean {
  return Boolean(
    listing.websiteUrl ||
      listing.phone ||
      listing.email ||
      listing.instagramUrl ||
      listing.facebookUrl ||
      listing.tiktokUrl ||
      listing.coverImageUrl ||
      listing.description ||
      listing.trackLengthM ||
      listing.openingHours ||
      listing.events?.length
  );
}
