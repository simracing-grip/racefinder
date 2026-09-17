import type { CalendarEvent } from "@/lib/types";
import { CALENDAR_EVENTS } from "@/data/calendar-events";

// Upcoming (not-yet-finished) events, soonest first. A multi-day event
// counts as upcoming until its last day has passed.
export async function getUpcomingEvents(): Promise<CalendarEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  return [...CALENDAR_EVENTS]
    .filter((e) => (e.endDate ?? e.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
