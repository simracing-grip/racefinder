"use client";

import { useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import CategoryBadge from "./CategoryBadge";
import ListingDetails from "./ListingDetails";
import MapView from "@/components/Map/MapView";
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

export default function ListingRow({ listing }: { listing: Listing }) {
  const [open, setOpen] = useState(false);
  const accentColor = CATEGORY_COLOR[listing.categories[0]] ?? "#2563eb";

  return (
    <div
      className={`overflow-hidden rounded-xl border bg-gray-900 transition ${
        open ? "border-gray-600 shadow-sm" : "border-gray-800 hover:border-gray-600"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-3.5 text-left sm:p-4"
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: listing.coverImageUrl ? undefined : accentColor }}
        >
          {listing.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.coverImageUrl} alt="" className="h-full w-full object-cover" />
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
          <h3 className="mt-1 truncate font-semibold text-gray-100">{listing.name}</h3>
          <p className="flex items-center gap-1.5 truncate text-sm text-gray-400">
            <CountryFlag countryCode={listing.countryCode} />
            {listing.city}, {listing.country}
          </p>
        </div>

        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-gray-800 bg-gray-950/50 p-3.5 sm:p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.2fr]">
            <MapView listings={[listing]} height="200px" />
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
        </div>
      )}
    </div>
  );
}
