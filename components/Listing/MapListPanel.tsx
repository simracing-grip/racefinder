"use client";

import { useEffect, useRef, useState } from "react";
import type { ListingSummary } from "@/lib/types";
import MapView from "@/components/Map/MapView";
import ListingList from "./ListingList";

// Map beside a scrollable venue list (stacked on mobile), with the selected
// venue kept in sync between the two. Used by the home explorer and the
// category/country pages. Selection can be controlled by the caller or left
// to this component.
export default function MapListPanel({
  listings,
  title,
  summary,
  action,
  selectedSlug: controlledSlug,
  onSelect,
  distances,
  resetKey,
  height = "640px",
  initialCount = 20,
}: {
  /** Already sorted in the order the list should show. */
  listings: ListingSummary[];
  title: string;
  /** Shown after the venue count, e.g. "locations — race weekends first". */
  summary: string;
  /** Optional link/button beside the title. */
  action?: React.ReactNode;
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  distances?: Record<string, number>;
  /** Scrolls the list back to the top whenever this changes (e.g. a new filter). */
  resetKey?: string;
  height?: string;
  initialCount?: number;
}) {
  const [ownSlug, setOwnSlug] = useState<string | null>(null);
  const selectedSlug = controlledSlug !== undefined ? controlledSlug : ownSlug;
  const select = (slug: string | null) => (onSelect ? onSelect(slug) : setOwnSlug(slug));
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [resetKey]);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="overflow-hidden border border-white/10">
        <MapView listings={listings} height={height} selectedSlug={selectedSlug} onSelect={select} />
      </div>

      <div className="flex flex-col border border-white/10 bg-asphalt lg:h-[var(--panel-h)]" style={{ ["--panel-h" as string]: height }}>
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl font-black uppercase italic text-white">{title}</h2>
            {action}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            <span className="font-mono text-gray-300">{listings.length.toLocaleString("en-GB")}</span> {summary}
          </p>
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto p-3">
          <ListingList
            listings={listings}
            initialCount={initialCount}
            selectedSlug={selectedSlug}
            onSelect={select}
            distances={distances}
          />
        </div>
      </div>
    </div>
  );
}

