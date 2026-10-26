import type { CalendarEvent } from "@/lib/types";
import { CALENDAR_EVENTS } from "@/data/calendar-events";
import { todayUtc } from "@/lib/today";
import { filterUpcoming } from "@/lib/listingSort";

// Upcoming (not-yet-finished) events, soonest first. A multi-day event
// counts as upcoming until its last day has passed.
export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  return filterUpcoming(CALENDAR_EVENTS, todayUtc());
}

