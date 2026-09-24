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

export default function HomeExplorer({
  listings,
  countries,
  initialCountry,
}: {
  listings: Listing[];
  countries: string[];
  initialCountry?: string;
}) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [country, setCountry] = useState(initialCountry ?? "");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const inCountry = useMemo(
    () => (country ? listings.filter((l) => l.country === country) : listings),
    [listings, country]
  );
  const filtered = useMemo(
    () => (category === "all" ? inCountry : inCountry.filter((l) => l.categories.includes(category))),
    [inCountry, category]
  );
  const sorted = useMemo(() => sortByUpcomingEvent(filtered), [filtered]);

  const counts = useMemo(() => {
    const byCategory = {} as Record<Category, number>;
    for (const c of CATEGORIES) {
      byCategory[c.value] = inCountry.filter((l) => l.categories.includes(c.value)).length;
    }
    return byCategory;
  }, [inCountry]);

  const activeMeta = CATEGORIES.find((c) => c.value === category);

  function pickCategory(next: CategoryFilter) {
    setCategory(next);
    setSelectedSlug(null);
  }

  function pickCountry(next: string) {
    setCountry(next);
    setSelectedSlug(null);
  }

  return (
    <div>
      <div className="mb-4">
        <FilterBar
          countries={countries}
          activeCategory={category}
          counts={counts}
          allCount={inCountry.length}
          country={country}
          onCategoryChange={pickCategory}
          onCountryChange={pickCountry}
        />
      </div>

      <MapView listings={filtered} height="420px" selectedSlug={selectedSlug} onSelect={setSelectedSlug} />

      <section className="mx-auto mt-8 max-w-3xl">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4">
          <h2 className="text-lg font-semibold">
            {activeMeta ? activeMeta.plural : "Upcoming at these venues"}
          </h2>
          {activeMeta && (
            <Link href={`/category/${activeMeta.value}`} className="text-sm text-blue-400 hover:underline">
              Open full page &rarr;
            </Link>
          )}
        </div>
        <p className="mb-3 text-sm text-gray-400">
          {filtered.length} location{filtered.length === 1 ? "" : "s"}
          {country ? ` in ${country}` : ""} &mdash; venues with a race coming up come first. Pick one to
          find it on the map.
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
