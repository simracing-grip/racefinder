"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, Listing } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { sortByUpcomingEvent } from "@/lib/listingSort";
import MapView from "@/components/Map/MapView";
import ListingList from "@/components/Listing/ListingList";
import FilterBar from "@/components/Filters/FilterBar";

type CategoryFilter = Category | "all";

// Country is handled by the hero's CountryPicker (a dedicated /country/[slug]
// page), so this only filters by category — no in-place country state here.
export default function HomeExplorer({ listings }: { listings: Listing[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filtered = useMemo(
    () => (category === "all" ? listings : listings.filter((l) => l.categories.includes(category))),
    [listings, category]
  );
  const sorted = useMemo(() => sortByUpcomingEvent(filtered), [filtered]);

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
  }

  return (
    <div>
      <div className="mb-4">
        <FilterBar
          activeCategory={category}
          counts={counts}
          allCount={listings.length}
          onCategoryChange={pickCategory}
        />
      </div>

      <MapView listings={filtered} height="420px" selectedSlug={selectedSlug} onSelect={setSelectedSlug} />

      <section className="mx-auto mt-8 max-w-3xl">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="text-lg font-semibold">{activeMeta ? activeMeta.plural : "Coming up"}</h2>
          {activeMeta && (
            <Link href={`/category/${activeMeta.value}`} className="text-sm text-blue-400 hover:underline">
              Open full page &rarr;
            </Link>
          )}
        </div>
        <p className="mb-3 text-sm text-gray-400">
          {filtered.length} location{filtered.length === 1 ? "" : "s"} &mdash; venues with a race coming
          up come first. Pick one to find it on the map.
        </p>
        <ListingList
          listings={sorted}
          initialCount={10}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
        />
      </section>
    </div>
  );
}
