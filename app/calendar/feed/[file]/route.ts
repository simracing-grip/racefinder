import { CALENDAR_EVENTS } from "@/data/calendar-events";
import { SERIES_FULL_NAME, SERIES_ORDER } from "@/lib/seriesMeta";
import type { EventSeries } from "@/lib/types";
import { buildIcs } from "@/lib/ics";
import { SITE_URL } from "@/lib/site";

// Subscribable calendar feeds: /calendar/feed/all.ics and one per series
// (/calendar/feed/f1.ics, /calendar/feed/motogp.ics, ...). The whole season
// is included, past rounds too, so a subscribed calendar reads complete.
export const revalidate = 3600;

export function generateStaticParams() {
  const present = SERIES_ORDER.filter((s) => CALENDAR_EVENTS.some((e) => e.series === s));
  return [{ file: "all.ics" }, ...present.map((s) => ({ file: `${s}.ics` }))];
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const key = file.replace(/\.ics$/, "");
  const series = key === "all" ? null : (key as EventSeries);
  if (!file.endsWith(".ics") || (series && !SERIES_FULL_NAME[series])) {
    return new Response("Not found", { status: 404 });
  }

  const events = CALENDAR_EVENTS.filter((e) => !series || e.series === series).sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  const body = buildIcs({
    events,
    siteUrl: SITE_URL,
    calendarName: series ? `${SERIES_FULL_NAME[series]} · RaceFinder` : "Motorsport race calendar · RaceFinder",
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${file}"`,
    },
  });
}
