"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/components/Search/useSearch";
import SearchResultList from "@/components/Search/SearchResultList";

// The home page's big search box. Same /api/search results and ranking as
// the header palette (components/Search/SearchPalette), shown as a dropdown.
export default function HeroSearch() {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { results, loading, ready } = useSearch(query);

  function go(href: string) {
    setOpen(false);
    router.push(href);
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
      go(results[active].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showPanel = open && ready;

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
          aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
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
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-96 overflow-y-auto border border-white/10 bg-panel shadow-2xl shadow-black/60">
          <SearchResultList
            id={listId}
            results={results}
            active={active}
            onActive={setActive}
            onPick={go}
            query={query}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
