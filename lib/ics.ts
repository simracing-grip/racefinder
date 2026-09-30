import slugify from "slugify";
import type { EventSeries } from "@/lib/types";
import { SERIES_LABEL, SERIES_FULL_NAME } from "@/lib/seriesMeta";

// Calendar export for race weekends: .ics files (RFC 5545) for single events
// and per-series subscription feeds, plus Google Calendar links. Race
// weekends are all-day events — the data has dates, not session times.

export interface IcsEvent {
  series: EventSeries;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  circuitName?: string;
  city?: string;
  country?: string;
  listingSlug?: string;
  sourceUrl?: string;
}

// Stable per race, so re-downloading or a feed refresh updates the same
// calendar entry instead of adding a duplicate.
export function eventId(e: Pick<IcsEvent, "series" | "startDate" | "name">): string {
  return slugify(`${e.series}-${e.startDate}-${e.name}`, { lower: true, strict: true });
}

export function eventTitle(e: IcsEvent): string {
  // Many names already start with the series ("Formula 3 – Monza"); don't repeat it.
  const label = SERIES_LABEL[e.series];
  return e.name.toLowerCase().includes(label.toLowerCase()) ? e.name : `${label} · ${e.name}`;
}

export function eventLocation(e: IcsEvent): string {
  return [e.circuitName, e.city, e.country].filter(Boolean).join(", ");
}

function compactDate(iso: string): string {
  return iso.replace(/-/g, "");
}

// All-day DTEND is exclusive: the day after the last day.
function dayAfter(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function describe(e: IcsEvent, siteUrl: string): string {
  const lines = [SERIES_FULL_NAME[e.series]];
  if (e.listingSlug) lines.push(`Venue: ${siteUrl}/listings/${e.listingSlug}`);
  if (e.sourceUrl) lines.push(`Official info: ${e.sourceUrl}`);
  lines.push(`More races: ${siteUrl}/calendar`);
  return lines.join("\n");
}

// Text values escape \ ; , and newlines (RFC 5545 §3.3.11).
function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 octets are folded with CRLF + space (§3.1),
// counting UTF-8 bytes so accented names don't break the limit.
const encoder = new TextEncoder();
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

function vevent(e: IcsEvent, siteUrl: string, stamp: string): string[] {
  const url = e.listingSlug ? `${siteUrl}/listings/${e.listingSlug}` : `${siteUrl}/calendar`;
  const host = new URL(siteUrl).hostname;
  return [
    "BEGIN:VEVENT",
    `UID:${eventId(e)}@${host}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compactDate(e.startDate)}`,
    `DTEND;VALUE=DATE:${compactDate(dayAfter(e.endDate ?? e.startDate))}`,
    `SUMMARY:${esc(eventTitle(e))}`,
    ...(eventLocation(e) ? [`LOCATION:${esc(eventLocation(e))}`] : []),
    `DESCRIPTION:${esc(describe(e, siteUrl))}`,
    `URL:${url}`,
    `CATEGORIES:${esc(SERIES_LABEL[e.series])}`,
    "TRANSP:TRANSPARENT", // don't show the whole weekend as "busy"
    "END:VEVENT",
  ];
}

export function buildIcs({
  events,
  siteUrl,
  calendarName,
}: {
  events: IcsEvent[];
  siteUrl: string;
  /** Set for subscription feeds; shown as the calendar's name in apps. */
  calendarName?: string;
}): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RaceFinder//Race calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(calendarName
      ? [
          `X-WR-CALNAME:${esc(calendarName)}`,
          `X-WR-CALDESC:${esc(`Race weekends from ${siteUrl}/calendar`)}`,
          // Ask subscribing apps to re-check twice a day (dates do move).
          "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
          "X-PUBLISHED-TTL:PT12H",
        ]
      : []),
    ...events.flatMap((e) => vevent(e, siteUrl, stamp)),
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

// "Add to Google Calendar" link for one race (no file download needed).
export function googleCalendarUrl(e: IcsEvent, siteUrl: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: eventTitle(e),
    dates: `${compactDate(e.startDate)}/${compactDate(dayAfter(e.endDate ?? e.startDate))}`,
    details: describe(e, siteUrl),
    location: eventLocation(e),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

// Subscription links for a feed URL (https://…/calendar/feed/f1.ics).
export function subscribeLinks(feedUrl: string) {
  const webcal = feedUrl.replace(/^https?:/, "webcal:");
  return {
    webcal, // Apple Calendar, and Outlook desktop
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
    https: feedUrl, // paste into Outlook.com / anything else
  };
}
