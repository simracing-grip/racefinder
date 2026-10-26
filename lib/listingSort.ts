import type { CalendarEvent, TrackEvent } from "@/lib/types";
import { todayUtc } from "@/lib/today";

// Kept separate from lib/listings.ts so client components can use it without
// bundling the whole venue dataset.
// Structural param types so both full Listings and ListingSummaries work.
// Client components pass `today` from useToday() (components/Time/
// TodayProvider.tsx) so hydration matches the cached server HTML.
export function getNextEvent(
  listing: { events?: TrackEvent[] },
  today = todayUtc()
): TrackEvent | undefined {
  return (listing.events ?? [])
    .filter((e) => (e.endDate ?? e.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

// Soonest-upcoming-event first; venues with no upcoming event sort after
// those that have one, keeping their relative order (Array#sort is stable).
export function sortByUpcomingEvent<T extends { events?: TrackEvent[] }>(listings: T[], today?: string): T[] {
  return [...listings]
    .map((listing) => ({ listing, next: getNextEvent(listing, today)?.startDate }))
    .sort((a, b) => {
      if (a.next && b.next) return a.next.localeCompare(b.next);
      if (a.next) return -1;
      if (b.next) return 1;
      return 0;
    })
    .map((x) => x.listing);
}

// Not-yet-finished events, soonest first (a multi-day event counts until its
// last day has passed). Client components re-apply this with the visitor's
// date (useToday) to the list the server filtered when the page was cached.
export function filterUpcoming(events: readonly CalendarEvent[], today = todayUtc()): CalendarEvent[] {
  return events
    .filter((e) => (e.endDate ?? e.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function formatEventDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
