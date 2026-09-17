"use client";

import { useState } from "react";
import Link from "next/link";
import type { Listing } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import CountryFlag from "@/components/CountryFlag";
import CategoryBadge from "./CategoryBadge";

const PREVIEW_COUNT = 4;

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white/90">
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

function PreviewCard({ listing }: { listing: Listing }) {
  const accentColor = CATEGORY_COLOR[listing.categories[0]] ?? "#2563eb";

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 p-2.5 transition hover:border-gray-600"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md"
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
        <div className="mb-0.5 flex flex-wrap gap-1">
          {listing.categories.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
        </div>
        <p className="truncate text-sm font-medium text-gray-100">{listing.name}</p>
        <p className="flex items-center gap-1 truncate text-xs text-gray-400">
          <CountryFlag countryCode={listing.countryCode} />
          {listing.city}
        </p>
      </div>
    </Link>
  );
}

export default function CategoryPreview({ listings }: { listings: Listing[] }) {
  const [active, setActive] = useState(CATEGORIES[0].value);
  const activeMeta = CATEGORIES.find((c) => c.value === active)!;
  const filtered = listings.filter((l) => l.categories.includes(active));
  const preview = filtered.slice(0, PREVIEW_COUNT);

  return (
    <section>
      <div className="mb-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setActive(c.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              active === c.value
                ? "border-transparent bg-blue-600 text-white"
                : "border-gray-800 bg-gray-900 text-gray-300 hover:border-gray-600"
            }`}
          >
            {c.plural}
          </button>
        ))}
      </div>

      {preview.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center text-gray-500">
          No {activeMeta.plural.toLowerCase()} listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {preview.map((listing) => (
            <PreviewCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <Link
        href={`/category/${active}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:underline"
      >
        View all {activeMeta.plural.toLowerCase()} ({filtered.length}) &rarr;
      </Link>
    </section>
  );
}
