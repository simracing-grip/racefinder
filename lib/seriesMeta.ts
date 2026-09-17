import type { EventSeries } from "@/lib/types";

// Display metadata for race series (data/calendar-events.ts), separate from
// site categories (lib/categoryMeta.ts) — a series is what's racing, a
// category is what kind of venue this directory lists.
export const SERIES_LABEL: Record<EventSeries, string> = {
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  motogp: "MotoGP",
  gt3: "GT3",
  gt4: "GT4",
  imsa: "IMSA",
  wec: "WEC",
  wrc: "WRC",
  wrc2: "WRC2",
  wrc_junior: "WRC Junior",
};

export const SERIES_FULL_NAME: Record<EventSeries, string> = {
  f1: "Formula 1",
  f2: "FIA Formula 2 Championship",
  f3: "FIA Formula 3 Championship",
  f4: "Formula 4",
  motogp: "MotoGP",
  gt3: "GT World Challenge Europe",
  gt4: "GT4 European Series",
  imsa: "IMSA WeatherTech SportsCar Championship",
  wec: "FIA World Endurance Championship",
  wrc: "FIA World Rally Championship",
  wrc2: "FIA WRC2 Championship",
  wrc_junior: "FIA WRC Junior Championship",
};

export const SERIES_BADGE_CLASS: Record<EventSeries, string> = {
  f1: "bg-amber-500/15 text-amber-300",
  f2: "bg-yellow-500/15 text-yellow-300",
  f3: "bg-lime-500/15 text-lime-300",
  f4: "bg-cyan-500/15 text-cyan-300",
  motogp: "bg-orange-500/15 text-orange-300",
  gt3: "bg-red-500/15 text-red-300",
  gt4: "bg-blue-500/15 text-blue-300",
  imsa: "bg-teal-500/15 text-teal-300",
  wec: "bg-purple-500/15 text-purple-300",
  wrc: "bg-green-500/15 text-green-300",
  wrc2: "bg-emerald-500/15 text-emerald-300",
  wrc_junior: "bg-lime-600/15 text-lime-400",
};

export const SERIES_ORDER: EventSeries[] = [
  "f1",
  "f2",
  "f3",
  "f4",
  "motogp",
  "gt3",
  "gt4",
  "imsa",
  "wec",
  "wrc",
  "wrc2",
  "wrc_junior",
];
