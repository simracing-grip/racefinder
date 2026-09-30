"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSearch } from "./useSearch";
import SearchResultList from "./SearchResultList";

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// Site-wide search in the header: a button that opens a search dialog.
// Ctrl/⌘+K or "/" opens it from anywhere (except while typing in a field).
export default function SearchPalette() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { results, loading, ready } = useSearch(open ? query : "");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    // Keep the page behind from scrolling while the dialog is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setQuery("");
    setActive(0);
  }

  function go(href: string) {
    close();
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
      close();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search venues and places"
        className="flex items-center gap-2 border border-white/10 px-2.5 py-2 text-sm text-gray-400 transition hover:border-white/30 hover:text-white xl:w-52"
      >
        <SearchIcon />
        <span className="hidden xl:inline">Search…</span>
        <kbd className="ml-auto hidden border border-white/10 px-1.5 font-mono text-[10px] text-gray-500 xl:inline">/</kbd>
      </button>

      {/* Portaled to <body>: the sticky header's backdrop-blur would otherwise
          become the containing block for this fixed overlay and trap it. */}
      {open &&
        createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/80 px-3 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <div role="dialog" aria-modal="true" aria-label="Search" className="w-full max-w-xl border border-white/10 bg-panel shadow-2xl shadow-black/60">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 focus-within:border-signal">
              <SearchIcon className="h-5 w-5 shrink-0 text-gray-500" />
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-expanded={ready}
                aria-controls={listId}
                aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
                placeholder="Search tracks, cities, countries…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                className="w-full bg-transparent text-base text-white placeholder:text-gray-500 focus:outline-none"
              />
              <button type="button" onClick={close} className="shrink-0 border border-white/10 px-1.5 font-mono text-[10px] text-gray-500 hover:text-white">
                ESC
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {ready ? (
                <SearchResultList
                  id={listId}
                  results={results}
                  active={active}
                  onActive={setActive}
                  onPick={go}
                  query={query}
                  loading={loading}
                />
              ) : (
                <p className="px-4 py-4 text-sm text-gray-500">
                  Try a circuit (&ldquo;Monza&rdquo;), a city (&ldquo;London&rdquo;) or a country.
                </p>
              )}
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
