"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { ListingSummary } from "@/lib/types";

function MapPlaceholder() {
  return (
    <div className="grid-lines flex h-full w-full items-center justify-center bg-asphalt text-sm text-gray-500">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-signal" aria-hidden />
        Loading map&hellip;
      </span>
    </div>
  );
}

// MapLibre touches `window` at module load, so it can only run client-side —
// dynamic() with ssr:false keeps it out of the server render entirely.
const MapLibreMap = dynamic(() => import("./MapLibreMap"), {
  ssr: false,
  loading: MapPlaceholder,
});

// Start loading a bit before the map scrolls into view, so it's usually
// ready by the time it's on screen.
const PRELOAD_MARGIN = "800px 0px";

// The MapLibre bundle is the site's largest script (~280 KB compressed,
// ~1 MB parsed) and the map then pulls its own style and tiles. It isn't
// imported until the map is near the viewport, so pages where it sits below
// the fold (the home page) don't pay for it up front. Maps already on screen
// load straight away.
export default function MapView({
  listings,
  height = "500px",
  selectedSlug,
  onSelect,
}: {
  listings: ListingSummary[];
  height?: string;
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: PRELOAD_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  return (
    // Reserves the map's height up front so nothing shifts when it loads.
    <div ref={ref} className="w-full" style={{ height }}>
      {near ? (
        <MapLibreMap listings={listings} height={height} selectedSlug={selectedSlug} onSelect={onSelect} />
      ) : (
        <MapPlaceholder />
      )}
    </div>
  );
}
