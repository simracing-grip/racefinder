"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import ListingRow from "./ListingRow";

export default function ListingList({
  listings,
  initialCount,
  selectedSlug,
  onSelect,
}: {
  listings: Listing[];
  initialCount?: number;
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 p-10 text-center text-gray-500">
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
          key={listing.id}
          listing={listing}
          selected={listing.slug === selectedSlug}
          onSelect={onSelect}
        />
      ))}

      {showToggle && (
        <button
          onClick={() => setExpanded(collapsed)}
          className="mt-1 self-center rounded-full border border-gray-800 bg-gray-900 px-5 py-2 text-sm font-medium text-gray-300 hover:border-gray-600"
        >
          {collapsed ? `Show all ${listings.length} locations` : "Show less"}
        </button>
      )}
    </div>
  );
}
