"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CalendarEvent, EventSeries } from "@/lib/types";
import { SERIES_LABEL, SERIES_BADGE_CLASS, SERIES_ORDER } from "@/lib/seriesMeta";
import CountryFlag from "@/components/CountryFlag";

function formatEventDate(event: CalendarEvent): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const start = new Date(event.startDate);
  if (!event.endDate || event.endDate === event.startDate) return fmt(start);
  return `${fmt(start)} – ${fmt(new Date(event.endDate))}`;
}

export default function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [activeSeries, setActiveSeries] = useState<EventSeries | "all">("all");

  const filtered = useMemo(
    () => (activeSeries === "all" ? events : events.filter((e) => e.series === activeSeries)),
    [events, activeSeries]
  );

  const seriesPresent = useMemo(
    () => SERIES_ORDER.filter((s) => events.some((e) => e.series === s)),
    [events]
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSeries("all")}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
            activeSeries === "all"
              ? "bg-gray-100 text-gray-900"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          All
        </button>
        {seriesPresent.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSeries(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              activeSeries === s
                ? "bg-gray-100 text-gray-900"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {SERIES_LABEL[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400">No upcoming events in this series yet.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((event, i) => {
            const content = (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-600">
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${SERIES_BADGE_CLASS[event.series]}`}
                >
                  {SERIES_LABEL[event.series]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-gray-100">{event.name}</div>
                  <div className="flex items-center gap-1.5 truncate text-sm text-gray-400">
                    <CountryFlag countryCode={event.countryCode ?? ""} />
                    {event.circuitName} &middot; {event.city}, {event.country}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-medium text-gray-300">
                  {formatEventDate(event)}
                </span>
              </div>
            );

            return (
              <li key={`${event.series}-${event.name}-${event.startDate}-${i}`}>
                {event.listingSlug ? (
                  <Link href={`/listings/${event.listingSlug}`}>{content}</Link>
                ) : event.sourceUrl ? (
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
