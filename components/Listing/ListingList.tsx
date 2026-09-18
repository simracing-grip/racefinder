"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import ListingRow from "./ListingRow";

export default function ListingList({
  listings,
  initialCount,
}: {
  listings: Listing[];
  initialCount?: number;
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
  const visible = showToggle && !expanded ? listings.slice(0, initialCount) : listings;

  return (
    <div className="flex flex-col gap-3">
      {visible.map((listing) => (
        <ListingRow key={listing.id} listing={listing} />
      ))}

      {showToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 self-center rounded-full border border-gray-800 bg-gray-900 px-5 py-2 text-sm font-medium text-gray-300 hover:border-gray-600"
        >
          {expanded ? "Show less" : `Show all ${listings.length} locations`}
        </button>
      )}
    </div>
  );
}
