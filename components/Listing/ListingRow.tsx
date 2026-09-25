"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import { formatEventDate, getNextEvent } from "@/lib/listingSort";
import CategoryBadge from "./CategoryBadge";
import ListingDetails from "./ListingDetails";
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

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white/90">
      <path
        d="M5 3v18M5 4h13l-3 4 3 4H5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ListingRow({
  listing,
  selected = false,
  onSelect,
}: {
  listing: Listing;
  selected?: boolean;
  onSelect?: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const accentColor = CATEGORY_COLOR[listing.categories[0]] ?? "#2563eb";
  const nextEvent = getNextEvent(listing);

  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div
      ref={rowRef}
      className={`overflow-hidden rounded-xl border bg-gray-900 transition ${
        selected
          ? "border-red-500 ring-1 ring-red-500/60"
          : open
            ? "border-gray-600 shadow-sm"
            : "border-gray-800 hover:border-gray-600"
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
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: listing.coverImageUrl ? undefined : accentColor }}
        >
          {listing.coverImageUrl ? (
            <Image
              src={listing.coverImageUrl}
              alt={listing.name}
              width={56}
              height={56}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <FlagIcon />
          )}
        </div>

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
            {listing.city}, {listing.country}
          </p>
          {nextEvent && (
            <p className="mt-0.5 truncate text-xs font-medium text-red-400">
              Next: {nextEvent.name} &middot; {formatEventDate(nextEvent.startDate)}
            </p>
          )}
        </div>

        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-gray-800 bg-gray-950/50 p-3.5 sm:p-4">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-3.5">
            <ListingDetails listing={listing} />
            <Link
              href={`/listings/${listing.slug}`}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:underline"
            >
              Open full page &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
