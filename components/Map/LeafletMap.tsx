"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import type { Listing } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_BADGE_CLASS } from "@/lib/categoryMeta";

// Bundler-safe marker icons: point at the CDN copy of the same leaflet
// version instead of wiring up webpack asset imports for the PNGs.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// CARTO's free "Positron" basemap: minimal and light, so the colored pins
// stay the visual focus instead of competing with a busy default OSM style.
// No API key required. Swap for a MapTiler/Stadia key (see README) before
// real production traffic — this is still a shared free tier.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_SUBDOMAINS = "abcd";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function markerColor(listing: Listing): string {
  return CATEGORY_COLOR[listing.categories[0]] ?? "#2563eb";
}

// A rounded map-pin (not a plain dot) so markers read as "place markers"
// rather than generic data points — closer to how Google/Apple Maps pins
// feel, but in the category color with a clean white core.
function pinIcon(color: string, featured: boolean) {
  const svg = `
    <svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13 21.7 13.5 22.2.4.4 1 .6 1.5.6s1.1-.2 1.5-.6C17 36.7 30 25.5 30 15 30 6.7 23.3 0 15 0z"
        fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
      ${featured ? '<circle cx="15" cy="15" r="2.5" fill="' + color + '"/>' : ""}
    </svg>`;
  return L.divIcon({
    className: "listing-marker",
    html: svg,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  });
}

function popupHtml(listing: Listing): string {
  const badges = listing.categories
    .map(
      (c) =>
        `<span class="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE_CLASS[c]}">${CATEGORY_LABEL[c]}</span>`
    )
    .join(" ");
  const buttonColor = markerColor(listing);

  return `
    <div class="w-56">
      <div class="flex flex-wrap gap-1">${badges}</div>
      <div class="mt-1.5 text-[15px] font-semibold leading-snug text-gray-900">${escapeHtml(listing.name)}</div>
      <div class="text-xs text-gray-500">${escapeHtml(listing.city)}, ${escapeHtml(listing.country)}</div>
      <a class="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90" style="background:${buttonColor};color:#ffffff" href="/listings/${listing.slug}">
        View details &rarr;
      </a>
    </div>`;
}

function ClusterLayer({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 34 : count < 25 ? 40 : 48;
        return L.divIcon({
          className: "cluster-marker",
          html: `<div style="width:${size}px;height:${size}px" class="flex items-center justify-center rounded-full bg-gray-900 text-white font-bold shadow-lg ring-4 ring-white">${count}</div>`,
          iconSize: L.point(size, size),
        });
      },
    });
    groupRef.current = group;

    for (const listing of listings) {
      const marker = L.marker([listing.lat, listing.lng], {
        icon: pinIcon(markerColor(listing), Boolean(listing.featured)),
      });
      marker.bindPopup(popupHtml(listing), { className: "listing-popup" });
      group.addLayer(marker);
    }

    map.addLayer(group);
    if (listings.length > 0) {
      // fitBounds instead of a fixed center/zoom: works equally well for a
      // single country's worth of pins and a worldwide spread (e.g. F1).
      map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 11 });
    }
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
      : [30, 10]; // roughly centered on the whole map when empty

  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm ring-1 ring-black/5"
    >
      <MapContainer
        center={center}
        zoom={listings.length > 0 ? 4 : 2}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} subdomains={TILE_SUBDOMAINS} />
        <ClusterLayer listings={listings} />
      </MapContainer>
      <style jsx global>{`
        .leaflet-container {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f3f4f6;
        }
        .listing-marker,
        .cluster-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          padding: 2px;
        }
        .leaflet-popup-content {
          margin: 10px 12px;
        }
        .leaflet-popup-tip {
          box-shadow: none;
        }
        .leaflet-bar {
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
          border: none !important;
        }
        .leaflet-bar a {
          border-bottom-color: #e5e7eb !important;
        }
      `}</style>
    </div>
  );
}
