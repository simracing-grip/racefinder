import { getUpcomingEvents } from "@/lib/calendar";
import { SERIES_LABEL } from "@/lib/seriesMeta";
import { formatEventDate } from "@/lib/listingSort";
import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard, flagEmoji } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RaceFinder race calendar";
// Same cadence as the calendar page, so the "next race" stays current.
export const revalidate = 3600;

export default async function Image() {
  const events = await getUpcomingEvents();
  const next = events[0];
  return renderOgCard({
    kicker: "Race calendar",
    title: next ? next.name : "Every race ahead",
    subtitle: next
      ? `${flagEmoji(next.countryCode)} ${next.circuitName} · ${events.length} rounds ahead across ${new Set(events.map((e) => e.series)).size} series`.trim()
      : undefined,
    badge: next ? `Up next: ${SERIES_LABEL[next.series]} · ${formatEventDate(next.startDate)}` : undefined,
  });
}
