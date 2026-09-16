"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

// MapLibre touches `window` at module load, so it can only run client-side —
// dynamic() with ssr:false keeps it out of the server render entirely.
const MapLibreMap = dynamic(() => import("./MapLibreMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900 text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

export default function MapView({
  listings,
  height,
}: {
  listings: Listing[];
  height?: string;
}) {
  return <MapLibreMap listings={listings} height={height} />;
}
