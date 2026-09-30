"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarEvent, EventSeries } from "@/lib/types";
import { SERIES_LABEL, SERIES_ORDER } from "@/lib/seriesMeta";
import CountryFlag from "@/components/CountryFlag";
import SeriesBadge from "./SeriesBadge";
import AddToCalendar from "./AddToCalendar";
import SubscribePanel from "./SubscribePanel";

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

function dayRange(event: CalendarEvent): string {
  const fmt = (iso: string) => utc(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  if (!event.endDate || event.endDate === event.startDate) return fmt(event.startDate);
  return `${fmt(event.startDate)} – ${fmt(event.endDate)}`;
}

function monthKey(iso: string): string {
  return utc(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

// Timing-sheet style race calendar: series filter chips, then rounds grouped
// under month headings, each row linking to the circuit's venue page when we
// list it (or the official source otherwise).
export default function CalendarView({ events, siteUrl }: { events: CalendarEvent[]; siteUrl: string }) {
  const [activeSeries, setActiveSeries] = useState<EventSeries | "all">("all");

  const filtered = useMemo(
    () => (activeSeries === "all" ? events : events.filter((e) => e.series === activeSeries)),
    [events, activeSeries]
  );

  const seriesPresent = useMemo(() => SERIES_ORDER.filter((s) => events.some((e) => e.series === s)), [events]);

  const months = useMemo(() => {
    const groups: { month: string; events: CalendarEvent[] }[] = [];
    for (const e of filtered) {
      const month = monthKey(e.startDate);
      const last = groups[groups.length - 1];
      if (last?.month === month) last.events.push(e);
      else groups.push({ month, events: [e] });
    }
    return groups;
  }, [filtered]);

  const chip = (active: boolean) =>
    `border px-3 py-1.5 font-display text-sm font-bold uppercase italic tracking-wide transition ${
      active ? "border-white bg-white text-ink" : "border-white/10 bg-asphalt text-gray-300 hover:border-white/30"
    }`;

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by series">
        <button type="button" onClick={() => setActiveSeries("all")} aria-pressed={activeSeries === "all"} className={chip(activeSeries === "all")}>
          All series <span className="font-mono text-xs not-italic opacity-60">{events.length}</span>
        </button>
        {seriesPresent.map((s) => (
          <button key={s} type="button" onClick={() => setActiveSeries(s)} aria-pressed={activeSeries === s} className={chip(activeSeries === s)}>
            {SERIES_LABEL[s]}
          </button>
        ))}
      </div>

      {/* follows the series filter: pick F1 above, subscribe to F1 here */}
      <div className="mb-10">
        <SubscribePanel series={activeSeries} siteUrl={siteUrl} />
      </div>

      {months.length === 0 ? (
        <p className="text-gray-400">No upcoming events in this series yet.</p>
      ) : (
        <div className="space-y-10">
          {months.map(({ month, events: monthEvents }) => (
            <section key={month}>
              <h2 className="mb-3 flex items-baseline gap-3 font-display text-3xl font-black uppercase italic text-white">
                {month}
                <span className="font-mono text-sm not-italic font-normal text-gray-500">
                  {monthEvents.length} round{monthEvents.length === 1 ? "" : "s"}
                </span>
              </h2>
              <ol className="divide-y divide-white/5 border border-white/10 bg-asphalt">
                {monthEvents.map((event, i) => {
                  const start = utc(event.startDate);
                  const row = (
                    <div className="group flex min-w-0 flex-1 items-center gap-4 py-3.5 pl-4 sm:gap-5">
                      <div className="w-12 shrink-0 text-center">
                        <p className="font-display text-3xl font-black italic leading-none text-white">
                          {start.getUTCDate()}
                        </p>
                        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                          {start.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}
                        </p>
                      </div>
                      <SeriesBadge series={event.series} className="hidden w-24 text-center sm:inline-block" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate font-semibold text-white group-hover:text-signal">
                          <SeriesBadge series={event.series} className="sm:hidden" />
                          <span className="truncate">{event.name}</span>
                        </p>
                        <p className="flex items-center gap-1.5 truncate text-sm text-gray-400">
                          {event.countryCode && <CountryFlag countryCode={event.countryCode} />}
                          {event.circuitName} &middot; {event.city}, {event.country}
                        </p>
                      </div>
                      <span className="hidden shrink-0 font-mono text-xs text-gray-400 md:block">{dayRange(event)}</span>
                      <span className="shrink-0 text-gray-600 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden>
                        {event.listingSlug ? "→" : event.sourceUrl ? "↗" : ""}
                      </span>
                    </div>
                  );

                  return (
                    <li
                      key={`${event.series}-${event.name}-${event.startDate}-${i}`}
                      className="flex items-center gap-2 pr-3 transition hover:bg-white/[0.03]"
                    >
                      {event.listingSlug ? (
                        <Link href={`/listings/${event.listingSlug}`} className="flex min-w-0 flex-1">
                          {row}
                        </Link>
                      ) : event.sourceUrl ? (
                        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1">
                          {row}
                        </a>
                      ) : (
                        row
                      )}
                      <AddToCalendar event={event} siteUrl={siteUrl} compact />
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
