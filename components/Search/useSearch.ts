"use client";

import { useEffect, useState } from "react";
import type { SearchResult } from "@/lib/search";

const DEBOUNCE_MS = 120;

// Queries /api/search as the user types: debounced, and each new query
// aborts the previous request so a slow response can't overwrite a newer one.
export function useSearch(query: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale results when the query gets too short
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => r.json() as Promise<{ results: SearchResult[] }>)
        .then((data) => {
          setResults(data.results);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  return { results, loading, ready: q.length >= 2 };
}
