// Race-calendar dates for tracks already listed in this directory — F1 and
// GT3 (GT World Challenge Europe) rounds only, Europe-scoped for now to
// match the rest of the site.
//
// Unlike data/generated-listings.ts, this file is hand/agent-maintained
// directly (not produced by the import pipeline) since calendar dates need
// far more frequent updates than venue location data. Keyed by listing
// slug — see lib/listings.ts, which merges this onto each Listing at read
// time. Only add entries for a slug that's a REAL match confirmed via
// research; never guess a track's calendar.
//
// Populated 2026-09-16 from the official 2026 F1 calendar
// (https://www.formula1.com/en/racing/2026) and the official 2026 GT World
// Challenge Europe calendar (https://www.gt-world-challenge-europe.com/calendar).
// Re-verify each season — dates shift and rounds rotate on/off the calendar.
import type { TrackEvent } from "@/lib/types";

export const TRACK_EVENTS: Record<string, TrackEvent[]> = {
  "circuit-de-monaco": [
    {
      series: "f1",
      name: "Monaco Grand Prix",
      startDate: "2026-06-05",
      endDate: "2026-06-07",
      season: 2026,
      sourceUrl: "https://www.formula1.com/en/racing/2026",
    },
  ],
  "circuit-de-barcelona-catalunya": [
    {
      series: "f1",
      name: "Barcelona-Catalunya Grand Prix",
      startDate: "2026-06-12",
      endDate: "2026-06-14",
      season: 2026,
      sourceUrl: "https://en.wikipedia.org/wiki/2026_Barcelona-Catalunya_Grand_Prix",
    },
    {
      series: "gt3",
      name: "GT World Challenge Europe Sprint Cup – Barcelona",
      startDate: "2026-10-02",
      endDate: "2026-10-04",
      season: 2026,
      sourceUrl: "https://www.gt-world-challenge-europe.com/calendar",
    },
  ],
  "red-bull-ring": [
    {
      series: "f1",
      name: "Austrian Grand Prix",
      startDate: "2026-06-26",
      endDate: "2026-06-28",
      season: 2026,
      sourceUrl: "https://www.formula1.com/en/racing/2026",
    },
  ],
  "circuit-de-spa-francorchamps": [
    {
      series: "f1",
      name: "Belgian Grand Prix",
      startDate: "2026-07-17",
      endDate: "2026-07-19",
      season: 2026,
      sourceUrl: "https://www.formula1.com/en/racing/2026",
    },
    {
      series: "gt3",
      name: "CrowdStrike 24 Hours of Spa",
      startDate: "2026-06-23",
      endDate: "2026-06-28",
      season: 2026,
      sourceUrl: "https://www.gt-world-challenge-europe.com/calendar",
    },
  ],
  "hungaroring": [
    {
      series: "f1",
      name: "Hungarian Grand Prix",
      startDate: "2026-07-24",
      endDate: "2026-07-26",
      season: 2026,
      sourceUrl: "https://www.formula1.com/en/racing/2026",
    },
  ],
  "circuit-zandvoort": [
    {
      series: "f1",
      name: "Dutch Grand Prix",
      startDate: "2026-08-21",
      endDate: "2026-08-23",
      season: 2026,
      sourceUrl: "https://www.formula1.com/en/racing/2026",
    },
    {
      series: "gt3",
      name: "GT World Challenge Europe Sprint Cup – Zandvoort",
      startDate: "2026-09-18",
      endDate: "2026-09-20",
      season: 2026,
      sourceUrl: "https://www.gt-world-challenge-europe.com/calendar",
    },
  ],
  "autodromo-nazionale-monza": [
    {
      series: "f1",
      name: "Italian Grand Prix",
      startDate: "2026-09-04",
      endDate: "2026-09-06",
      season: 2026,
      sourceUrl: "https://www.formula1.com/en/racing/2026",
    },
    {
      series: "gt3",
      name: "3 Hours of Monza",
      startDate: "2026-05-28",
      endDate: "2026-05-31",
      season: 2026,
      sourceUrl: "https://www.gt-world-challenge-europe.com/calendar",
    },
  ],
  "nurburgring": [
    {
      series: "gt3",
      name: "3 Hours of Nürburgring",
      startDate: "2026-08-28",
      endDate: "2026-08-30",
      season: 2026,
      sourceUrl: "https://www.gt-world-challenge-europe.com/calendar",
    },
  ],
  "brands-hatch-circuit": [
    {
      series: "gt3",
      name: "GT World Challenge Europe Sprint Cup – Brands Hatch",
      startDate: "2026-05-02",
      endDate: "2026-05-03",
      season: 2026,
      sourceUrl: "https://www.gt-world-challenge-europe.com/calendar",
    },
  ],
};
