"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Category, ListingSummary } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { sortByUpcomingEvent } from "@/lib/listingSort";
import { distanceKm } from "@/lib/geo";
import MapView from "@/components/Map/MapView";
import ListingList from "@/components/Listing/ListingList";
import NearMeControl, { type GeoStatus } from "@/components/Home/NearMeControl";
import CategoryIcon from "@/components/Home/CategoryIcon";
import SectionHeading from "@/components/Home/SectionHeading";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";

type CategoryFilter = Category | "all";

// Country is handled by the hero country picker (a dedicated /country/[slug]
// page), so this only filters by category and distance. Map and list sit
// side by side on desktop so picking a pin and reading the venue are one
// glance apart.
export default function HomeExplorer({ listings }: { listings: ListingSummary[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [nearMe, setNearMe] = useState(false);
  const [radiusKm, setRadiusKm] = useState(100);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  function toggleNearMe() {
    if (nearMe) {
      setNearMe(false);
      return;
    }
    setNearMe(true);
    setSelectedSlug(null);
    if (coords) return; // already have a fix from a previous toggle
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  }

  const categoryFiltered = useMemo(
    () => (category === "all" ? listings : listings.filter((l) => l.categories.includes(category))),
    [listings, category]
  );

  const distances = useMemo(() => {
    if (!coords) return null;
    const map: Record<string, number> = {};
    for (const l of listings) map[l.slug] = distanceKm(coords, { lat: l.lat, lng: l.lng });
    return map;
  }, [listings, coords]);

  const filtered = useMemo(() => {
    if (!nearMe || !distances) return categoryFiltered;
    return categoryFiltered.filter((l) => (distances[l.slug] ?? Infinity) <= radiusKm);
  }, [categoryFiltered, nearMe, distances, radiusKm]);

  const sorted = useMemo(() => {
    if (nearMe && distances) {
      return [...filtered].sort((a, b) => (distances[a.slug] ?? Infinity) - (distances[b.slug] ?? Infinity));
    }
    return sortByUpcomingEvent(filtered);
  }, [filtered, nearMe, distances]);

  const counts = useMemo(() => {
    const byCategory = {} as Record<Category, number>;
    for (const c of CATEGORIES) {
      byCategory[c.value] = listings.filter((l) => l.categories.includes(c.value)).length;
    }
    return byCategory;
  }, [listings]);

  const activeMeta = CATEGORIES.find((c) => c.value === category);

  function pickCategory(next: CategoryFilter) {
    setCategory(next);
    setSelectedSlug(null);
    listRef.current?.scrollTo({ top: 0 });
  }

  const chips: { value: CategoryFilter; label: string; count: number; color: string }[] = [
    { value: "all", label: "All", count: listings.length, color: "#f4f4f5" },
    ...CATEGORIES.filter((c) => counts[c.value] > 0).map((c) => ({
      value: c.value,
      label: c.label,
      count: counts[c.value],
      color: CATEGORY_COLOR[c.value],
    })),
  ];

  return (
    <section id="explore" className="mx-auto max-w-7xl scroll-mt-24 px-4">
      <SectionHeading kicker="The paddock" title="Explore every venue" href="/map" hrefLabel="Full-screen map" />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by discipline">
          {chips.map((chip) => {
            const active = category === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => pickCategory(chip.value)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 border px-3 py-2 text-sm font-semibold transition ${
                  active ? "border-white bg-white text-ink" : "border-white/10 bg-asphalt text-gray-300 hover:border-white/30"
                }`}
              >
                <span style={{ color: active ? undefined : chip.color }}>
                  <CategoryIcon category={chip.value} className="h-4 w-4" />
                </span>
                {chip.label}
                <span className={`font-mono text-xs ${active ? "text-ink/60" : "text-gray-500"}`}>{chip.count}</span>
              </button>
            );
          })}
        </div>
        <NearMeControl
          active={nearMe}
          status={geoStatus}
          radiusKm={radiusKm}
          onToggle={toggleNearMe}
          onRadiusChange={setRadiusKm}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-hidden border border-white/10">
          <MapView listings={filtered} height="640px" selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
        </div>

        <div className="flex flex-col border border-white/10 bg-asphalt lg:h-[640px]">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-2xl font-black uppercase italic text-white">
                {nearMe ? "Near you" : activeMeta ? activeMeta.plural : "Coming up"}
              </h3>
              {activeMeta && !nearMe && (
                <Link href={`/category/${activeMeta.value}`} className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white">
                  Full page &rarr;
                </Link>
              )}
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              <span className="font-mono text-gray-300">{filtered.length.toLocaleString("en-GB")}</span>{" "}
              {nearMe
                ? `location${filtered.length === 1 ? "" : "s"} within ${radiusKm} km — closest first`
                : `location${filtered.length === 1 ? "" : "s"} — race weekends first. Tap one to find it on the map.`}
            </p>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-3">
            <ListingList
              listings={sorted}
              initialCount={20}
              selectedSlug={selectedSlug}
              onSelect={setSelectedSlug}
              distances={nearMe ? distances ?? undefined : undefined}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
