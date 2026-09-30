import type { Listing } from "@/lib/types";

// Karting-page filters, driven by URL params so filtered views are linkable:
// /category/karting?setting=indoor&karts=electric&length=long
//
// Only venues whose detail is *known* match a filter — nothing is guessed
// from names. Coverage is still partial (it grows as kart-map-scout /
// sync-track-details fill it in), and the page says so.

export type KartFilterKey = "setting" | "karts" | "length";

export interface KartFilterOption {
  value: string;
  label: string;
  test: (l: Listing) => boolean;
}

export const KART_FILTERS: { key: KartFilterKey; label: string; options: KartFilterOption[] }[] = [
  {
    key: "setting",
    label: "Setting",
    options: [
      // "both" venues have an indoor and an outdoor track, so they match either.
      { value: "indoor", label: "Indoor", test: (l) => l.indoorOutdoor === "indoor" || l.indoorOutdoor === "both" },
      { value: "outdoor", label: "Outdoor", test: (l) => l.indoorOutdoor === "outdoor" || l.indoorOutdoor === "both" },
    ],
  },
  {
    key: "karts",
    label: "Karts",
    options: [
      { value: "electric", label: "Electric", test: (l) => ["electric", "both"].includes(l.details?.karting?.kart_type ?? "") },
      { value: "petrol", label: "Petrol", test: (l) => ["petrol", "both"].includes(l.details?.karting?.kart_type ?? "") },
    ],
  },
  {
    key: "length",
    label: "Track length",
    options: [
      { value: "short", label: "Under 500 m", test: (l) => !!l.trackLengthM && l.trackLengthM < 500 },
      { value: "medium", label: "500–1,000 m", test: (l) => !!l.trackLengthM && l.trackLengthM >= 500 && l.trackLengthM <= 1000 },
      { value: "long", label: "Over 1 km", test: (l) => !!l.trackLengthM && l.trackLengthM > 1000 },
    ],
  },
];

export type KartFilterState = Partial<Record<KartFilterKey, string>>;

// Ignores unknown keys/values, so a hand-edited URL can't break the page.
export function parseKartFilters(params: Record<string, string | string[] | undefined>): KartFilterState {
  const state: KartFilterState = {};
  for (const f of KART_FILTERS) {
    const v = params[f.key];
    if (typeof v === "string" && f.options.some((o) => o.value === v)) state[f.key] = v;
  }
  return state;
}

function optionFor(key: KartFilterKey, value: string | undefined) {
  return KART_FILTERS.find((f) => f.key === key)?.options.find((o) => o.value === value);
}

export function applyKartFilters(listings: Listing[], state: KartFilterState, except?: KartFilterKey): Listing[] {
  return listings.filter((l) =>
    KART_FILTERS.every((f) => {
      if (f.key === except || !state[f.key]) return true;
      return optionFor(f.key, state[f.key])!.test(l);
    })
  );
}

// Per option: how many venues it would show, given the *other* active
// filters (so counts stay meaningful while combining filters).
export function kartFilterCounts(listings: Listing[], state: KartFilterState) {
  return KART_FILTERS.map((f) => {
    const base = applyKartFilters(listings, state, f.key);
    return {
      ...f,
      active: state[f.key],
      options: f.options.map((o) => ({ value: o.value, label: o.label, count: base.filter(o.test).length })),
    };
  });
}

export function hasKartFilters(state: KartFilterState): boolean {
  return Object.values(state).some(Boolean);
}
