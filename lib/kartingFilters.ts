import type { Category, Listing } from "@/lib/types";

// Category-page filters, driven by URL params so filtered views are linkable:
//   /category/karting?setting=indoor&karts=electric&length=long
//   /category/track_day?open=motorbikes
//
// Only venues whose detail is *known* match a filter — nothing is guessed
// from names. Coverage is still partial (it grows as kart-map-scout /
// sync-track-details / the motorbike-drift scouts fill it in), and the page
// says so. (The file keeps its original karting name; circuits reuse it.)

export type KartFilterKey = "setting" | "karts" | "length" | "open";

export interface KartFilterOption {
  value: string;
  label: string;
  test: (l: Listing) => boolean;
}

export type FilterDefs = { key: KartFilterKey; label: string; options: KartFilterOption[] }[];

export const KART_FILTERS: FilterDefs = [
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

// Circuits: public motorcycle track days and drift sessions
// (data/venue-activities.ts).
export const CIRCUIT_FILTERS: FilterDefs = [
  {
    key: "open",
    label: "Also runs",
    options: [
      { value: "motorbikes", label: "Motorbike days", test: (l) => !!l.activities?.motorbikes },
      { value: "drift", label: "Drift", test: (l) => !!l.activities?.drift },
    ],
  },
];

export function filtersForCategory(category: Category): FilterDefs {
  if (category === "karting") return KART_FILTERS;
  if (category === "track_day" || category === "f1") return CIRCUIT_FILTERS;
  return [];
}

export type KartFilterState = Partial<Record<KartFilterKey, string>>;

// Ignores unknown keys/values, so a hand-edited URL can't break the page.
export function parseKartFilters(
  params: Record<string, string | string[] | undefined>,
  defs: FilterDefs = KART_FILTERS
): KartFilterState {
  const state: KartFilterState = {};
  for (const f of defs) {
    const v = params[f.key];
    if (typeof v === "string" && f.options.some((o) => o.value === v)) state[f.key] = v;
  }
  return state;
}

function optionFor(defs: FilterDefs, key: KartFilterKey, value: string | undefined) {
  return defs.find((f) => f.key === key)?.options.find((o) => o.value === value);
}

export function applyKartFilters(
  listings: Listing[],
  state: KartFilterState,
  except?: KartFilterKey,
  defs: FilterDefs = KART_FILTERS
): Listing[] {
  return listings.filter((l) =>
    defs.every((f) => {
      if (f.key === except || !state[f.key]) return true;
      return optionFor(defs, f.key, state[f.key])!.test(l);
    })
  );
}

// Per option: how many venues it would show, given the *other* active
// filters (so counts stay meaningful while combining filters).
export function kartFilterCounts(listings: Listing[], state: KartFilterState, defs: FilterDefs = KART_FILTERS) {
  return defs.map((f) => {
    const base = applyKartFilters(listings, state, f.key, defs);
    return {
      key: f.key,
      label: f.label,
      active: state[f.key],
      options: f.options.map((o) => ({ value: o.value, label: o.label, count: base.filter(o.test).length })),
    };
  });
}

export function hasKartFilters(state: KartFilterState): boolean {
  return Object.values(state).some(Boolean);
}
