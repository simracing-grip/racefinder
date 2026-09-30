"use client";

import type { SearchResult } from "@/lib/search";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/categoryMeta";
import CountryFlag from "@/components/CountryFlag";

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-signal" aria-hidden>
      <path d="M10 2a6 6 0 0 0-6 6c0 4.5 6 10 6 10s6-5.5 6-10a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

// Result rows shared by the header palette and the home hero search.
// Selection is by mousedown so it fires before the input's blur.
export default function SearchResultList({
  id,
  results,
  active,
  onActive,
  onPick,
  query,
  loading,
}: {
  id: string;
  results: SearchResult[];
  active: number;
  onActive: (i: number) => void;
  onPick: (href: string) => void;
  query: string;
  loading: boolean;
}) {
  if (results.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-gray-400">
        {loading ? "Searching…" : <>No venues or places match &ldquo;{query}&rdquo; yet.</>}
      </p>
    );
  }

  return (
    <ul id={id} role="listbox" aria-label="Search results">
      {results.map((r, i) => (
        <li
          key={r.href}
          id={`${id}-${i}`}
          role="option"
          aria-selected={i === active}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(r.href);
          }}
          onMouseEnter={() => onActive(i)}
          className={`flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 ${
            i === active ? "border-signal bg-white/5" : "border-transparent"
          }`}
        >
          {r.type === "venue" ? (
            <>
              <CountryFlag countryCode={r.countryCode} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{r.name}</p>
                <p className="truncate text-xs text-gray-400">{[r.city, r.country].filter(Boolean).join(", ")}</p>
              </div>
              <span
                className="shrink-0 font-display text-xs font-bold uppercase italic tracking-wide"
                style={{ color: CATEGORY_COLOR[r.category] }}
              >
                {CATEGORY_LABEL[r.category]}
              </span>
            </>
          ) : (
            <>
              {r.type === "country" && r.countryCode ? <CountryFlag countryCode={r.countryCode} className="shrink-0" /> : <PinIcon />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {r.type === "city" ? `Places to race near ${r.name}` : r.name}
                </p>
                <p className="truncate text-xs text-gray-400">{r.type === "city" ? r.country : "Country"}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-gray-500">{r.count} venues</span>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
