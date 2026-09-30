"use client";

import { useState } from "react";
import type { ListingSummary } from "@/lib/types";
import ListingRow from "./ListingRow";

export default function ListingList({
  listings,
  initialCount,
  selectedSlug,
  onSelect,
  distances,
}: {
  listings: ListingSummary[];
  initialCount?: number;
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
  distances?: Record<string, number>;
}) {
  const [expanded, setExpanded] = useState(false);

  if (listings.length === 0) {
    return (
      <div className="border border-dashed border-white/15 p-10 text-center text-gray-500">
        No locations match these filters yet.
      </div>
    );
  }

  const showToggle = initialCount != null && listings.length > initialCount;
  // A venue picked on the map may sit past the short list; reveal it.
  const selectedIndex = selectedSlug ? listings.findIndex((l) => l.slug === selectedSlug) : -1;
  const collapsed = showToggle && !expanded && !(selectedIndex >= initialCount!);
  const visible = collapsed ? listings.slice(0, initialCount) : listings;

  return (
    <div className="flex flex-col gap-3">
      {visible.map((listing) => (
        <ListingRow
          key={listing.slug}
          listing={listing}
          selected={listing.slug === selectedSlug}
          onSelect={onSelect}
          distanceKm={distances?.[listing.slug]}
        />
      ))}

      {showToggle && (
        <button
          onClick={() => setExpanded(collapsed)}
          className="mt-1 self-center border border-white/15 bg-panel px-5 py-2 text-sm font-semibold text-gray-300 hover:border-white/40 hover:text-white"
        >
          {collapsed ? `Show all ${listings.length} locations` : "Show less"}
        </button>
      )}
    </div>
  );
}
