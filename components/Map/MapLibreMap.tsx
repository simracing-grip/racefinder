"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Listing, Category } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_BADGE_CLASS } from "@/lib/categoryMeta";

// Turbopack's dev server doesn't correctly serve the ES-module Web Worker
// MapLibre spawns for tile parsing (the request 404s as text/html, so the
// map silently never finishes loading — no console error, no failed
// network request even, just a permanently blank canvas). Pointing it at a
// static copy in /public sidesteps the bundler's worker-URL resolution
// entirely. Two files, both straight copies from node_modules/maplibre-gl/dist/:
//   - maplibre-gl-worker.mjs  (the worker entry point)
//   - maplibre-gl-shared.mjs  (a relative import *inside* the worker file —
//     easy to miss copying, since the failure mode is identical: worker
//     loads fine but silently never responds, no error propagates to the
//     main thread)
// Re-copy both after bumping the maplibre-gl version.
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

// OpenFreeMap: free vector tiles, no API key, no rate limit (donation-funded,
// explicitly built as a no-signup replacement for Mapbox/MapTiler/CARTO).
// "dark" matches the site's dark theme, as crisp vector tiles instead of
// raster images — smoother pan/zoom, sharper at every zoom level.
// https://openfreemap.org
const STYLE_URL = "https://tiles.openfreemap.org/styles/dark";

const CATEGORY_ORDER: Category[] = ["sim_racing", "track_day", "karting", "f1"];

function pinSvg(color: string): string {
  return `<svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 13 21.7 13.5 22.2.4.4 1 .6 1.5.6s1.1-.2 1.5-.6C17 36.7 30 25.5 30 15 30 6.7 23.3 0 15 0z"
      fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="15" cy="15" r="5.5" fill="white"/>
  </svg>`;
}

function loadPinImage(map: maplibregl.Map, id: string, color: string) {
  return new Promise<void>((resolve) => {
    const svg = pinSvg(color);
    const img = new Image(30, 38);
    img.onload = () => {
      if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
      resolve();
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

function listingsToGeoJSON(listings: Listing[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: listings.map((l) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [l.lng, l.lat] },
      properties: {
        slug: l.slug,
        name: l.name,
        city: l.city,
        country: l.country,
        categories: l.categories.join(","),
        primaryCategory: l.categories[0],
        icon: `pin-${l.categories[0]}`,
      },
    })),
  };
}

function popupHtml(props: GeoJSON.GeoJsonProperties): string {
  if (!props) return "";
  const categories = String(props.categories).split(",") as Category[];
  const badges = categories
    .map(
      (c) =>
        `<span class="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORY_BADGE_CLASS[c]}">${CATEGORY_LABEL[c]}</span>`
    )
    .join(" ");
  const buttonColor = CATEGORY_COLOR[categories[0]] ?? "#2563eb";

  return `
    <div class="w-56">
      <div class="flex flex-wrap gap-1">${badges}</div>
      <div class="mt-1.5 text-[15px] font-semibold leading-snug text-gray-100">${escapeHtml(String(props.name))}</div>
      <div class="text-xs text-gray-400">${escapeHtml(String(props.city))}, ${escapeHtml(String(props.country))}</div>
      <a class="mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-90" style="background:${buttonColor};color:#ffffff" href="/listings/${props.slug}">
        View details &rarr;
      </a>
    </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function MapLibreMap({
  listings,
  height = "500px",
}: {
  listings: Listing[];
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [10, 30],
      zoom: 1.5,
      // Without this, MapLibre tiles the world side-by-side to fill wide
      // viewports/low zooms, so at a glance you see two Americas, two
      // Europes, etc. Disabling world-copy rendering keeps exactly one
      // copy of the globe on screen at any zoom or aspect ratio, instead
      // of relying on a "zoomed in enough" starting zoom that breaks again
      // on a wider window.
      renderWorldCopies: false,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
    // No customAttribution: the style's own sources already carry correct
    // OpenFreeMap/OpenMapTiles/OSM credit — adding our own string on top of
    // that just duplicated it.
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    let popup: maplibregl.Popup | null = null;

    map.on("load", async () => {
      await Promise.all(CATEGORY_ORDER.map((c) => loadPinImage(map, `pin-${c}`, CATEGORY_COLOR[c])));

      map.addSource("listings", {
        type: "geojson",
        data: listingsToGeoJSON(listings),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "listings",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#f3f4f6",
          "circle-radius": ["step", ["get", "point_count"], 17, 10, 20, 25, 24],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#111827",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "listings",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 13,
          "text-font": ["Noto Sans Bold"],
        },
        paint: { "text-color": "#111827" },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "symbol",
        source: "listings",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["get", "icon"],
          "icon-size": 0.9,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
        },
      });

      if (listings.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const l of listings) bounds.extend([l.lng, l.lat]);
        map.fitBounds(bounds, { padding: 40, maxZoom: 11, duration: 0 });
      }

      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "clusters", async (e: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("listings") as maplibregl.GeoJSONSource;
        if (clusterId === undefined) return;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });

      map.on("click", "unclustered-point", (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        popup?.remove();
        popup = new maplibregl.Popup({ closeButton: true, maxWidth: "240px" })
          .setLngLat(coords)
          .setHTML(popupHtml(feature.properties))
          .addTo(map);
      });
    });

    return () => {
      popup?.remove();
      map.remove();
    };
  }, [listings]);

  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl border border-gray-800 shadow-sm ring-1 ring-white/5"
    >
      <div ref={containerRef} className="h-full w-full" />
      <style jsx global>{`
        .maplibregl-popup-content {
          border-radius: 0.75rem;
          padding: 12px 14px;
          background: #1f2937;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3);
        }
        .maplibregl-popup-tip {
          border-top-color: #1f2937 !important;
          border-bottom-color: #1f2937 !important;
        }
        .maplibregl-popup-close-button {
          font-size: 18px;
          padding: 4px 8px;
          color: #9ca3af;
        }
        .maplibregl-ctrl-group {
          border-radius: 0.75rem !important;
          overflow: hidden;
          background: #1f2937 !important;
          box-shadow: 0 1px 3px rgb(0 0 0 / 0.4) !important;
        }
        .maplibregl-ctrl-group button {
          filter: invert(1) brightness(1.5);
        }
        .maplibregl-ctrl-attrib {
          background: rgba(31, 41, 55, 0.7) !important;
        }
        .maplibregl-ctrl-attrib a {
          color: #d1d5db !important;
        }
      `}</style>
    </div>
  );
}
