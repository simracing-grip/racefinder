"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

// Leaflet touches `window` at module load, so it can only run client-side —
// dynamic() with ssr:false keeps it out of the server render entirely.
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400">
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
  return <LeafletMap listings={listings} height={height} />;
}
