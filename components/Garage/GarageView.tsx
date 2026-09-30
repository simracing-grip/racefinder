"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Listing, TrackEvent } from "@/lib/types";
import { useGarage } from "@/lib/garage";
import { CATEGORY_LABEL, CATEGORY_COLOR } from "@/lib/categoryMeta";
import { getNextEvent, formatEventDate } from "@/lib/listingSort";
import VenuePhoto from "@/components/Listing/VenuePhoto";
import CountryFlag from "@/components/CountryFlag";
import SeriesBadge from "@/components/Calendar/SeriesBadge";
import AddToCalendar from "@/components/Calendar/AddToCalendar";
import SaveButton from "./SaveButton";

type Fresh = Record<string, Listing | "gone">;

const noop = () => () => {};

// Current record for a saved venue: the listing, "gone" if it was removed
// from the directory (404), or null if the request failed (retry later).
async function fetchFresh(slug: string): Promise<Listing | "gone" | null> {
  try {
    const res = await fetch(`/api/listings/${encodeURIComponent(slug)}`);
    if (res.status === 404) return "gone";
    return res.ok ? ((await res.json()) as Listing) : null;
  } catch {
    return null;
  }
}

export default function GarageView({ siteUrl }: { siteUrl: string }) {
  const { items } = useGarage();
  // false during SSR/hydration, true after — avoids flashing "empty" before
  // localStorage has been read.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const [fresh, setFresh] = useState<Fresh>({});

  // Refresh saved snapshots from the server (current details + races), and
  // spot venues that have since been removed from the directory.
  // Each slug is fetched once per visit (tracked in a ref, not state, so a
  // failed request can't retrigger this effect in a loop).
  const attempted = useRef(new Set<string>());
  useEffect(() => {
    const missing = items.map((v) => v.slug).filter((slug) => !attempted.current.has(slug));
    if (missing.length === 0) return;
    missing.forEach((slug) => attempted.current.add(slug));
    Promise.all(missing.map(async (slug) => [slug, await fetchFresh(slug)] as const)).then((pairs) => {
      const found = pairs.filter((pair): pair is readonly [string, Listing | "gone"] => pair[1] !== null);
      if (found.length > 0) setFresh((prev) => ({ ...prev, ...Object.fromEntries(found) }));
    });
  }, [items]);

  if (!hydrated) {
    return <div className="h-40 animate-pulse border border-white/10 bg-asphalt" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-white/15 px-6 py-14 text-center">
        <p className="font-display text-3xl font-black uppercase italic text-white">Your garage is empty</p>
        <p className="mx-auto mt-3 max-w-md text-gray-400">
          Tap the star on any venue to save it here. Your garage lives in this browser — no account needed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/map" className="btn-skew bg-signal px-6 py-3 font-display text-lg font-black uppercase italic text-white transition hover:bg-white hover:text-ink">
            Find venues
          </Link>
          <Link href="/calendar" className="border border-white/20 px-5 py-3 font-display text-lg font-bold uppercase italic text-white transition hover:border-white">
            Race calendar
          </Link>
        </div>
      </div>
    );
  }

  // Upcoming rounds at saved venues, soonest first.
  const races = items
    .flatMap((v) => {
      const listing = fresh[v.slug];
      if (!listing || listing === "gone") return [];
      const today = new Date().toISOString().slice(0, 10);
      return (listing.events ?? [])
        .filter((e) => (e.endDate ?? e.startDate) >= today)
        .map((event) => ({ event, listing }));
    })
    .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate))
    .slice(0, 8);

  return (
    <div className="space-y-12">
      {races.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-3xl font-black uppercase italic text-white">Race weekends at your venues</h2>
          <ol className="divide-y divide-white/5 border border-white/10 bg-asphalt">
            {races.map(({ event, listing }: { event: TrackEvent; listing: Listing }) => (
              <li key={`${listing.slug}-${event.series}-${event.startDate}`} className="flex items-center gap-2 pr-3 transition hover:bg-white/[0.03]">
                <Link href={`/listings/${listing.slug}`} className="group flex min-w-0 flex-1 items-center gap-4 py-3 pl-4">
                  <span className="w-16 shrink-0 font-mono text-sm text-gray-300">{formatEventDate(event.startDate)}</span>
                  <SeriesBadge series={event.series} className="hidden sm:inline-block" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-white group-hover:text-signal">{event.name}</span>
                    <span className="block truncate text-xs text-gray-500">{listing.name}</span>
                  </span>
                </Link>
                <AddToCalendar
                  compact
                  siteUrl={siteUrl}
                  event={{ ...event, circuitName: listing.name, city: listing.city, country: listing.country, listingSlug: listing.slug }}
                />
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="mb-4 flex items-baseline gap-3 font-display text-3xl font-black uppercase italic text-white">
          Saved venues <span className="font-mono text-sm not-italic font-normal text-gray-500">{items.length}</span>
        </h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((saved) => {
            const current = fresh[saved.slug];
            const gone = current === "gone";
            const venue = current && current !== "gone" ? current : saved;
            const next = current && current !== "gone" ? getNextEvent(current) : undefined;
            const category = venue.categories[0];
            return (
              <li key={saved.slug} className={`flex items-center gap-3 border border-white/10 bg-asphalt p-3 ${gone ? "opacity-60" : ""}`}>
                <VenuePhoto
                  listing={{ name: venue.name, categories: venue.categories, coverImageUrl: venue.coverImageUrl }}
                  variant="thumb"
                  className="h-14 w-14 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  {gone ? (
                    <p className="truncate font-semibold text-white">{venue.name}</p>
                  ) : (
                    <Link href={`/listings/${saved.slug}`} className="block truncate font-semibold text-white hover:text-signal">
                      {venue.name}
                    </Link>
                  )}
                  <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                    <CountryFlag countryCode={venue.countryCode} />
                    <span style={{ color: CATEGORY_COLOR[category] }}>{CATEGORY_LABEL[category]}</span>
                    &middot; {venue.city || venue.country}
                  </p>
                  {gone ? (
                    <p className="text-xs text-amber-400">No longer listed</p>
                  ) : (
                    next && (
                      <p className="truncate text-xs font-medium text-timing">
                        Next: {next.name} &middot; {formatEventDate(next.startDate)}
                      </p>
                    )
                  )}
                </div>
                <SaveButton compact venue={saved} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
