import type { TrackEvent } from "@/lib/types";

// Kept separate from lib/listings.ts so client components can use it without
// bundling the whole venue dataset.
// Structural param types so both full Listings and ListingSummaries work.
export function getNextEvent(listing: { events?: TrackEvent[] }): TrackEvent | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return (listing.events ?? [])
    .filter((e) => (e.endDate ?? e.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

// Soonest-upcoming-event first; venues with no upcoming event sort after
// those that have one, keeping their relative order (Array#sort is stable).
export function sortByUpcomingEvent<T extends { events?: TrackEvent[] }>(listings: T[]): T[] {
  return [...listings]
    .map((listing) => ({ listing, next: getNextEvent(listing)?.startDate }))
    .sort((a, b) => {
      if (a.next && b.next) return a.next.localeCompare(b.next);
      if (a.next) return -1;
      if (b.next) return 1;
      return 0;
    })
    .map((x) => x.listing);
}

export function formatEventDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
