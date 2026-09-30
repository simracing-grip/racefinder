import Link from "next/link";
import type { CalendarEvent } from "@/lib/types";
import { SERIES_LABEL, SERIES_FULL_NAME } from "@/lib/seriesMeta";
import { formatEventDate } from "@/lib/listingSort";
import CountryFlag from "@/components/CountryFlag";
import Countdown from "./Countdown";
import SectionHeading from "./SectionHeading";

function dateRange(e: CalendarEvent): string {
  return e.endDate && e.endDate !== e.startDate
    ? `${formatEventDate(e.startDate)} – ${formatEventDate(e.endDate)}`
    : formatEventDate(e.startDate);
}

function eventHref(e: CalendarEvent): string {
  return e.listingSlug ? `/listings/${e.listingSlug}` : "/calendar";
}

// "Lights out" block: the next F1 weekend gets the big countdown (it's what
// most visitors follow); the soonest rounds from every other series sit beside it.
export default function NextRace({ events }: { events: CalendarEvent[] }) {
  const headline = events.find((e) => e.series === "f1") ?? events[0];
  if (!headline) return null;
  const upNext = events.filter((e) => e !== headline).slice(0, 6);

  return (
    <section className="mx-auto max-w-7xl px-4">
      <SectionHeading kicker="Lights out" title="The next race weekend" href="/calendar" hrefLabel="Full calendar" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Link
          href={eventHref(headline)}
          className="group relative overflow-hidden border border-white/10 bg-gradient-to-br from-panel via-asphalt to-ink p-6 transition hover:border-signal/60 sm:p-8"
        >
          <div className="speed-lines pointer-events-none absolute inset-0" aria-hidden />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl" aria-hidden />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="bg-signal px-2.5 py-1 font-display text-sm font-extrabold italic uppercase tracking-wide text-white">
                {SERIES_LABEL[headline.series]}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                {SERIES_FULL_NAME[headline.series]} &middot; {headline.season}
              </span>
            </div>
            <h3 className="mt-5 font-display text-5xl font-black uppercase italic leading-[0.9] text-white sm:text-6xl">
              {headline.name}
            </h3>
            <p className="mt-3 flex items-center gap-2 text-gray-300">
              {headline.countryCode && <CountryFlag countryCode={headline.countryCode} />}
              {headline.circuitName} &middot; {headline.city}
            </p>
            <p className="mt-1 font-mono text-sm text-gray-500">{dateRange(headline)}</p>
            <div className="mt-7">
              <Countdown startDate={headline.startDate} endDate={headline.endDate} />
            </div>
            <p className="mt-6 inline-flex items-center gap-2 font-display text-lg font-bold uppercase italic text-white group-hover:text-signal">
              {headline.listingSlug ? "View the circuit" : "See the calendar"} <span aria-hidden>&rarr;</span>
            </p>
          </div>
        </Link>

        <ol className="divide-y divide-white/5 border border-white/10 bg-asphalt">
          <li className="flex items-center justify-between px-5 py-3">
            <span className="font-display text-sm font-bold uppercase tracking-[0.2em] text-gray-500">Also on track</span>
            <span className="font-mono text-[11px] text-gray-600">DATE / SERIES / EVENT</span>
          </li>
          {upNext.map((e) => (
            <li key={`${e.series}-${e.name}-${e.startDate}`}>
              <Link href={eventHref(e)} className="group flex items-center gap-4 px-5 py-3 transition hover:bg-white/[0.03]">
                <span className="w-14 shrink-0 font-mono text-xs text-gray-400">{formatEventDate(e.startDate)}</span>
                <span className="w-16 shrink-0 font-display text-sm font-extrabold uppercase italic text-timing">
                  {SERIES_LABEL[e.series]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white group-hover:text-signal">{e.name}</span>
                  <span className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                    {e.countryCode && <CountryFlag countryCode={e.countryCode} />}
                    {e.circuitName}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
