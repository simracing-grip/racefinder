"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { formatEventDate, getNextEvent } from "@/lib/listingSort";
import { formatDistanceKm } from "@/lib/geo";
import CategoryBadge from "./CategoryBadge";
import ListingDetails from "./ListingDetails";
import PhotoCredit from "./PhotoCredit";
import VenuePhoto from "./VenuePhoto";
import CountryFlag from "@/components/CountryFlag";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ListingRow({
  listing,
  selected = false,
  onSelect,
  distanceKm,
}: {
  listing: Listing;
  selected?: boolean;
  onSelect?: (slug: string) => void;
  distanceKm?: number;
}) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const nextEvent = getNextEvent(listing);

  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div
      ref={rowRef}
      className={`overflow-hidden border bg-panel transition ${
        selected
          ? "border-signal ring-1 ring-signal/50"
          : open
            ? "border-white/25"
            : "border-white/10 hover:border-white/25"
      }`}
    >
      <button
        onClick={() => {
          setOpen((v) => !v);
          onSelect?.(listing.slug);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-3.5 text-left sm:p-4"
      >
        <VenuePhoto listing={listing} variant="thumb" className="h-14 w-14 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {listing.categories.map((c) => (
              <CategoryBadge key={c} category={c} />
            ))}
            {listing.featured && (
              <span className="inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                Featured
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-gray-100">{listing.name}</h3>
          <p className="flex items-center gap-1.5 truncate text-sm text-gray-400">
            <CountryFlag countryCode={listing.countryCode} />
            {listing.city ? `${listing.city}, ` : ""}
            {listing.country}
            {distanceKm != null && (
              <span className="shrink-0 text-gray-500">&middot; {formatDistanceKm(distanceKm)} away</span>
            )}
          </p>
          {nextEvent && (
            <p className="mt-0.5 truncate text-xs font-medium text-timing">
              Next: {nextEvent.name} &middot; {formatEventDate(nextEvent.startDate)}
            </p>
          )}
        </div>

        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-white/10 bg-ink/60 p-3.5 sm:p-4">
          <div className="border border-white/10 bg-asphalt p-3.5">
            <ListingDetails listing={listing} />
            {listing.coverImageUrl && listing.coverImageCredit && (
              <PhotoCredit credit={listing.coverImageCredit} className="mt-3" />
            )}
            <Link
              href={`/listings/${listing.slug}`}
              className="mt-3 inline-flex items-center gap-1 font-display text-base font-bold uppercase italic text-white hover:text-signal"
            >
              Open full page &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
