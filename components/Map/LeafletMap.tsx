"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { Listing } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/categoryMeta";

// Bundler-safe marker icons: point at the CDN copy of the same leaflet
// version instead of wiring up webpack asset imports for the PNGs.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Tile source: OpenStreetMap's demo tiles, fine for development. Swap for a
// MapTiler/Stadia Maps API key (see README) before real production traffic —
// osm.org's own tile server isn't meant for that.
const TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function markerColor(listing: Listing): string {
  return CATEGORY_COLOR[listing.categories[0]] ?? "#2563eb";
}

function ClusterLayer({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({ maxClusterRadius: 50 });
    groupRef.current = group;

    for (const listing of listings) {
      const icon = L.divIcon({
        className: "listing-marker",
        html: `<span style="background:${markerColor(
          listing
        )}" class="block h-4 w-4 rounded-full border-2 border-white shadow"></span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([listing.lat, listing.lng], { icon });
      marker.bindPopup(
        `<div class="text-sm">
           <div class="font-semibold">${escapeHtml(listing.name)}</div>
           <div class="text-gray-500">${escapeHtml(listing.city)}, ${escapeHtml(
          listing.country
        )}</div>
           <div class="mt-1">${listing.categories
             .map((c) => CATEGORY_LABEL[c])
             .join(" &middot; ")}</div>
           <a class="mt-2 inline-block text-blue-600 underline" href="/listings/${listing.slug}">View details</a>
         </div>`
      );
      group.addLayer(marker);
    }

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, listings]);

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function LeafletMap({
  listings,
  height = "500px",
}: {
  listings: Listing[];
  height?: string;
}) {
  const center: [number, number] =
    listings.length > 0
      ? [
          listings.reduce((sum, l) => sum + l.lat, 0) / listings.length,
          listings.reduce((sum, l) => sum + l.lng, 0) / listings.length,
        ]
      : [50.1, 10.3]; // roughly central Europe

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl border border-gray-200">
      <MapContainer
        center={center}
        zoom={listings.length > 0 ? 5 : 4}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ClusterLayer listings={listings} />
      </MapContainer>
    </div>
  );
}
