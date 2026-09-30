"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Category } from "@/lib/types";

// "My garage": venues a visitor has saved, kept in their browser's
// localStorage — no account. Each entry is a small snapshot so lists can
// render instantly; the /garage page refreshes them from /api/listings.
export interface SavedVenue {
  slug: string;
  name: string;
  categories: Category[];
  city: string;
  country: string;
  countryCode: string;
  coverImageUrl?: string;
  savedAt: number;
}

const KEY = "racefinder:garage:v1";
const EMPTY: SavedVenue[] = [];
const listeners = new Set<() => void>();
let cache: SavedVenue[] | null = null;

function isSavedVenue(v: unknown): v is SavedVenue {
  return !!v && typeof v === "object" && typeof (v as SavedVenue).slug === "string" && typeof (v as SavedVenue).name === "string";
}

// Stable reference between changes (useSyncExternalStore requires it).
// localStorage can throw (private mode, blocked storage) or hold junk, so
// both fall back to an empty garage.
function read(): SavedVenue[] {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter(isSavedVenue) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(items: SavedVenue[]) {
  cache = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable: still works for this page view
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the garage.
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export type SaveableVenue = Omit<SavedVenue, "savedAt">;

export function useGarage() {
  // Server render (and first client render) see an empty garage, then it
  // fills in after hydration — no mismatch.
  const items = useSyncExternalStore(subscribe, read, () => EMPTY);

  const has = useCallback((slug: string) => items.some((v) => v.slug === slug), [items]);

  const toggle = useCallback((venue: SaveableVenue) => {
    const current = read();
    write(
      current.some((v) => v.slug === venue.slug)
        ? current.filter((v) => v.slug !== venue.slug)
        : [
            {
              slug: venue.slug,
              name: venue.name,
              categories: venue.categories,
              city: venue.city,
              country: venue.country,
              countryCode: venue.countryCode,
              coverImageUrl: venue.coverImageUrl,
              savedAt: Date.now(),
            },
            ...current,
          ]
    );
  }, []);

  const remove = useCallback((slug: string) => write(read().filter((v) => v.slug !== slug)), []);

  return { items, has, toggle, remove };
}
