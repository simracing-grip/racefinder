"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ListingSummary } from "@/lib/types";
import { CATEGORY_LABEL, CATEGORY_COLOR } from "@/lib/categoryMeta";
import CountryFlag from "@/components/CountryFlag";

const MAX_RESULTS = 7;

function normalize(s: string): string {
  // Strip accents so "nurburgring" finds "Nürburgring".
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Instant, client-side venue search over the listings the home page already
// ships for the map — no extra request. Every word must match somewhere in
// name/city/country; name matches rank first.
export default function HeroSearch({ listings }: { listings: ListingSummary[] }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const index = useMemo(
    () =>
      listings.map((l) => ({
        listing: l,
        name: normalize(l.name),
        haystack: normalize(`${l.name} ${l.city} ${l.country}`),
      })),
    [listings]
  );

  const results = useMemo(() => {
    const words = normalize(query).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return index
      .filter((e) => words.every((w) => e.haystack.includes(w)))
      .sort(
        (a, b) =>
          Number(b.name.startsWith(words[0])) - Number(a.name.startsWith(words[0])) ||
          a.name.length - b.name.length
      )
      .slice(0, MAX_RESULTS)
      .map((e) => e.listing);
  }, [index, query]);

  function go(slug: string) {
    setOpen(false);
    router.push(`/listings/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].slug);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && query.trim().length > 0;

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-3 border border-white/10 bg-panel/90 px-4 py-3.5 shadow-2xl shadow-black/40 backdrop-blur transition focus-within:border-signal">
        <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0 text-gray-500" aria-hidden>
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Search venues, cities or countries"
          placeholder="Search tracks, cities, countries…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className="w-full bg-transparent text-base text-white placeholder:text-gray-500 focus:outline-none"
        />
        <kbd className="hidden shrink-0 border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-gray-500 sm:block">
          ENTER
        </kbd>
      </div>

      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-y-auto border border-white/10 bg-panel shadow-2xl shadow-black/60"
        >
          {results.length === 0 && (
            <li className="px-4 py-4 text-sm text-gray-400">
              No venues match &ldquo;{query}&rdquo; yet.
            </li>
          )}
          {results.map((l, i) => (
            <li
              key={l.slug}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so it fires before the input's blur closes the panel
              onMouseDown={(e) => {
                e.preventDefault();
                go(l.slug);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 ${
                i === active ? "border-signal bg-white/5" : "border-transparent"
              }`}
            >
              <CountryFlag countryCode={l.countryCode} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{l.name}</p>
                <p className="truncate text-xs text-gray-400">
                  {l.city ? `${l.city}, ` : ""}
                  {l.country}
                </p>
              </div>
              <span
                className="shrink-0 font-display text-xs font-bold uppercase italic tracking-wide"
                style={{ color: CATEGORY_COLOR[l.categories[0]] }}
              >
                {CATEGORY_LABEL[l.categories[0]]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
