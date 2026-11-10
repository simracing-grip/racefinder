"use client";

import type { CalendarEvent } from "@/lib/types";
import { filterUpcoming } from "@/lib/listingSort";
import { useToday } from "@/components/Time/TodayProvider";

// The hero's "Races ahead" figure — counted with the visitor's date, since
// the cached page may be days old (same count as /calendar).
export default function RacesAhead({ events }: { events: CalendarEvent[] }) {
  return <>{filterUpcoming(events, useToday()).length}</>;
}
