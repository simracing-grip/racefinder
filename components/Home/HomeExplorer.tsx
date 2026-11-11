"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Category, ListingSummary } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { sortByUpcomingEvent } from "@/lib/listingSort";
import { useToday } from "@/components/Time/TodayProvider";
import { distanceKm } from "@/lib/geo";
import MapListPanel from "@/components/Listing/MapListPanel";
import NearMeControl, { type GeoStatus } from "@/components/Home/NearMeControl";
import CategoryIcon from "@/components/Home/CategoryIcon";
import SectionHeading from "@/components/Home/SectionHeading";
import { CATEGORY_TEXT_COLOR } from "@/lib/categoryMeta";

type CategoryFilter = Category | "all";

// Country is handled by the hero country picker (a dedicated /country/[slug]
// page), so this only filters by category and distance. Map and list sit
// side by side on desktop so picking a pin and reading the venue are one
// glance apart.
const NO_LISTINGS: ListingSummary[] = [];

// The venue list comes from /api/summaries, fetched when this section is
// about to scroll into view, rather than embedded in the page: at ~3,200
// venues it was most of the home page's weight. The counts on the filter
// chips come from the server so they show straight away.
export default function HomeExplorer({ counts, total }: { counts: Record<Category, number>; total: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState<ListingSummary[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const listings = loaded ?? NO_LISTINGS;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let cancelled = false;
    const load = () => {
      fetch("/api/summaries")
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((data: ListingSummary[]) => !cancelled && setLoaded(data))
        .catch(() => !cancelled && setLoadFailed(true));
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "800px 0px" }
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const [nearMe, setNearMe] = useState(false);
  const [radiusKm, setRadiusKm] = useState(100);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const today = useToday();

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
    return sortByUpcomingEvent(filtered, today);
  }, [filtered, nearMe, distances, today]);

  const activeMeta = CATEGORIES.find((c) => c.value === category);

  function pickCategory(next: CategoryFilter) {
    setCategory(next);
    setSelectedSlug(null);
  }

  const chips: { value: CategoryFilter; label: string; count: number; color: string }[] = [
    { value: "all", label: "All", count: total, color: "#f4f4f5" },
    ...CATEGORIES.filter((c) => counts[c.value] > 0).map((c) => ({
      value: c.value,
      label: c.label,
      count: counts[c.value],
      color: CATEGORY_TEXT_COLOR[c.value],
    })),
  ];

  return (
    <section ref={sectionRef} id="explore" className="mx-auto max-w-7xl scroll-mt-24 px-4">
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

      {!loaded ? (
        <div
          className="flex h-[640px] items-center justify-center border border-white/10 bg-asphalt text-sm text-gray-400"
          role="status"
        >
          {loadFailed ? (
            <span>
              The map didn&apos;t load.{" "}
              <Link href="/map" className="link-accent">
                Open the full map
              </Link>
            </span>
          ) : (
            "Loading the map…"
          )}
        </div>
      ) : (
        <MapListPanel
          listings={sorted}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          distances={nearMe ? distances ?? undefined : undefined}
          resetKey={`${category}-${nearMe}`}
          title={nearMe ? "Near you" : activeMeta ? activeMeta.plural : "Coming up"}
          summary={
            nearMe
              ? `location${filtered.length === 1 ? "" : "s"} within ${radiusKm} km — closest first`
              : `location${filtered.length === 1 ? "" : "s"} — race weekends first. Tap one to find it on the map.`
          }
          action={
            activeMeta &&
            !nearMe && (
              <Link href={`/category/${activeMeta.value}`} className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-white">
                Full page &rarr;
              </Link>
            )
          }
        />
      )}
    </section>
  );
}
