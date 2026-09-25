"use client";

import { useEffect, useRef, useState } from "react";
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
        countryCode: l.countryCode,
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
  const countryCode = props.countryCode ? String(props.countryCode).toLowerCase() : "";
  const flag = countryCode
    ? `<span class="fi fi-${escapeHtml(countryCode)} inline-block rounded-[2px] align-[-1px]" aria-hidden="true"></span> `
    : "";

  return `
    <div class="w-56">
      <div class="flex flex-wrap gap-1">${badges}</div>
      <div class="mt-1.5 text-[15px] font-semibold leading-snug text-gray-100">${escapeHtml(String(props.name))}</div>
      <div class="text-xs text-gray-400">${flag}${escapeHtml(String(props.city))}, ${escapeHtml(String(props.country))}</div>
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

function fitToListings(map: maplibregl.Map, listings: Listing[], duration: number) {
  if (listings.length === 0) return;
  const bounds = new maplibregl.LngLatBounds();
  for (const l of listings) bounds.extend([l.lng, l.lat]);
  map.fitBounds(bounds, { padding: 40, maxZoom: 11, duration });
}

export default function MapLibreMap({
  listings,
  height = "500px",
  selectedSlug,
  onSelect,
}: {
  listings: Listing[];
  height?: string;
  selectedSlug?: string | null;
  onSelect?: (slug: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const layersReadyRef = useRef(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupSlugRef = useRef<string | null>(null);
  const listingsRef = useRef(listings);
  const onSelectRef = useRef(onSelect);
  const [mode, setMode] = useState<"clusters" | "all">("clusters");
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
    onSelectRef.current = onSelect;
  }, [mode, onSelect]);

  // Created once; later listing changes are pushed into the existing
  // sources (see the effect below) so filtering doesn't rebuild the map.
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

    map.on("load", async () => {
      await Promise.all(CATEGORY_ORDER.map((c) => loadPinImage(map, `pin-${c}`, CATEGORY_COLOR[c])));

      const clusteredVisibility = modeRef.current === "clusters" ? "visible" : "none";
      const flatVisibility = modeRef.current === "all" ? "visible" : "none";
      const geojson = listingsToGeoJSON(listingsRef.current);

      map.addSource("listings", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });

      // Same points, unclustered — backs the "show all" mode so every listing
      // renders as its own pin regardless of zoom, instead of bubbling into
      // cluster circles.
      map.addSource("listings-flat", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "listings",
        filter: ["has", "point_count"],
        layout: { visibility: clusteredVisibility },
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
          visibility: clusteredVisibility,
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
          visibility: clusteredVisibility,
        },
      });

      map.addLayer({
        id: "all-points",
        type: "symbol",
        source: "listings-flat",
        layout: {
          "icon-image": ["get", "icon"],
          "icon-size": 0.9,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
          visibility: flatVisibility,
        },
      });

      layersReadyRef.current = true;

      fitToListings(map, listingsRef.current, 0);

      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "unclustered-point", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "unclustered-point", () => (map.getCanvas().style.cursor = ""));
      map.on("mouseenter", "all-points", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "all-points", () => (map.getCanvas().style.cursor = ""));

      map.on("click", "clusters", async (e: maplibregl.MapMouseEvent) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("listings") as maplibregl.GeoJSONSource;
        if (clusterId === undefined) return;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });

      const openPointPopup = (e: maplibregl.MapLayerMouseEvent) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coords = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const slug = String(feature.properties?.slug);
        popupRef.current?.remove();
        popupSlugRef.current = slug;
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "240px" })
          .setLngLat(coords)
          .setHTML(popupHtml(feature.properties))
          .addTo(map);
        onSelectRef.current?.(slug);
      };

      map.on("click", "unclustered-point", openPointPopup);
      map.on("click", "all-points", openPointPopup);
    });

    return () => {
      layersReadyRef.current = false;
      popupRef.current?.remove();
      popupRef.current = null;
      popupSlugRef.current = null;
      map.remove();
    };
  }, []);

  // Filter changed: swap the data in place and re-frame the view.
  useEffect(() => {
    listingsRef.current = listings;
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    const geojson = listingsToGeoJSON(listings);
    (map.getSource("listings") as maplibregl.GeoJSONSource).setData(geojson);
    (map.getSource("listings-flat") as maplibregl.GeoJSONSource).setData(geojson);
    popupRef.current?.remove();
    popupSlugRef.current = null;
    fitToListings(map, listings, 600);
  }, [listings]);

  // A venue picked from the list: fly there and open its popup. Skipped when
  // the selection came from a pin click (popup already open for that slug).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current || !selectedSlug) return;
    if (popupSlugRef.current === selectedSlug) return;
    const listing = listingsRef.current.find((l) => l.slug === selectedSlug);
    if (!listing) return;
    const coords: [number, number] = [listing.lng, listing.lat];
    popupRef.current?.remove();
    popupSlugRef.current = selectedSlug;
    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: "240px" })
      .setLngLat(coords)
      .setHTML(
        popupHtml({
          slug: listing.slug,
          name: listing.name,
          city: listing.city,
          country: listing.country,
          countryCode: listing.countryCode,
          categories: listing.categories.join(","),
        })
      )
      .addTo(map);
    // 14 is past clusterMaxZoom, so the pin is guaranteed to be visible.
    map.easeTo({ center: coords, zoom: Math.max(map.getZoom(), 14) });
  }, [selectedSlug]);

  // Toggling the mode after the map is already up just flips layer
  // visibility — no need to touch the sources or recenter the view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !layersReadyRef.current) return;
    const clusteredVisibility = mode === "clusters" ? "visible" : "none";
    const flatVisibility = mode === "all" ? "visible" : "none";
    map.setLayoutProperty("clusters", "visibility", clusteredVisibility);
    map.setLayoutProperty("cluster-count", "visibility", clusteredVisibility);
    map.setLayoutProperty("unclustered-point", "visibility", clusteredVisibility);
    map.setLayoutProperty("all-points", "visibility", flatVisibility);
  }, [mode]);

  return (
    <div
      style={{ height }}
      className="relative w-full overflow-hidden rounded-2xl border border-gray-800 shadow-sm ring-1 ring-white/5"
    >
      <div ref={containerRef} className="h-full w-full" />

      <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-full bg-gray-900/90 p-1 shadow-sm ring-1 ring-white/10 backdrop-blur">
        <button
          type="button"
          onClick={() => setMode("clusters")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "clusters" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          Clustered
        </button>
        <button
          type="button"
          onClick={() => setMode("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "all" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          Show all
        </button>
      </div>

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
