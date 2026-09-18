"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Category, Listing } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import { sortByUpcomingEvent } from "@/lib/listingSort";
import MapView from "@/components/Map/MapView";
import ListingList from "@/components/Listing/ListingList";
import CountryFlag from "@/components/CountryFlag";

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
  const topRef = useRef<HTMLDivElement>(null);

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
    <div ref={topRef} className="scroll-mt-4">
      {/* Filters: one control set that drives the map, the list and the tiles */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-800 bg-gray-900/80 p-3 backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => pickCategory("all")}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              category === "all" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            All <span className="opacity-70">{inCountry.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => pickCategory(c.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                category === c.value ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {c.label} <span className="opacity-70">{counts[c.value]}</span>
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="home-country" className="text-sm text-gray-400">
            Country
          </label>
          <select
            id="home-country"
            value={country}
            onChange={(e) => pickCountry(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-100"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MapView listings={filtered} height="420px" selectedSlug={selectedSlug} onSelect={setSelectedSlug} />

      {/* List under the map */}
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

      {/* Browse by type: a visual hint of what each category holds */}
      <section className="mt-14">
        <h2 className="mb-1 text-lg font-semibold">Browse by type</h2>
        <p className="mb-4 text-sm text-gray-400">A taste of each category &mdash; pick one to filter the map above.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const sample = inCountry.filter((l) => l.categories.includes(c.value)).slice(0, 4);
            return (
              <button
                key={c.value}
                onClick={() => {
                  pickCategory(c.value);
                  topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 text-left transition hover:border-gray-600"
              >
                <div className="h-1" style={{ background: CATEGORY_COLOR[c.value] }} />
                <div className="p-3.5">
                  <p className="font-semibold text-gray-100">{c.plural}</p>
                  <p className="mb-2 text-xs text-gray-400">{counts[c.value]} locations</p>
                  <ul className="space-y-1">
                    {sample.map((l) => (
                      <li key={l.id} className="flex items-center gap-1.5 truncate text-xs text-gray-300">
                        <CountryFlag countryCode={l.countryCode} />
                        <span className="truncate">{l.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
