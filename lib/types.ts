export type Category = "sim_racing" | "track_day" | "karting" | "f1";

export const CATEGORIES: { value: Category; label: string; plural: string; global?: boolean }[] = [
  { value: "sim_racing", label: "Sim Racing", plural: "Sim Racing Centers" },
  { value: "track_day", label: "Track Day", plural: "Track Day Circuits" },
  { value: "karting", label: "Karting", plural: "Karting Tracks" },
  // Unlike the other categories (Europe-only for now), F1 covers every
  // continent the calendar races on — there's no "Europe first" phase-in
  // that makes sense for a fixed list of ~24 circuits.
  { value: "f1", label: "F1", plural: "Formula 1 Circuits", global: true },
];

export type IndoorOutdoor = "indoor" | "outdoor" | "both";

export interface SimRacingDetails {
  simulator_count?: number;
  simulator_platforms?: string[];
  motion_rig?: boolean;
  vr_available?: boolean;
  booking_type?: "walk_in" | "reservation_required" | "both";
}

export interface TrackDayDetails {
  track_config_variants?: string[];
  car_hire_available?: boolean;
  passenger_laps_available?: boolean;
  noise_restrictions?: string;
  operators?: string[];
  fia_grade?: string;
}

export interface KartingDetails {
  kart_type?: "petrol" | "electric" | "both";
  max_kart_speed_kmh?: number;
  min_age_or_height?: string;
  league_available?: boolean;
}

export interface ListingDetails {
  sim_racing?: SimRacingDetails;
  track_day?: TrackDayDetails;
  karting?: KartingDetails;
}

// A race-calendar date at a track this directory already lists — e.g. the
// Belgian Grand Prix at Spa, or a GT World Challenge Europe round at
// Hungaroring. Kept out of Listing/generated-listings.ts itself (see
// data/track-events.ts) since it needs far more frequent updates than venue
// location data and would otherwise get discarded on the next import.
export type EventSeries = "f1" | "gt3";

export interface TrackEvent {
  series: EventSeries;
  name: string;
  startDate: string; // ISO date, e.g. "2026-07-26"
  endDate?: string; // ISO date; omit for a single-day event
  season: number;
  sourceUrl?: string;
}

export interface Listing {
  id: string;
  slug: string;
  name: string;
  categories: Category[];
  status: "draft" | "pending" | "published" | "archived";
  country: string;
  countryCode: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  websiteUrl?: string;
  phone?: string;
  email?: string;
  description?: string;
  coverImageUrl?: string;
  googleMapsUrl?: string;
  indoorOutdoor?: IndoorOutdoor;
  trackLengthM?: number;
  details?: ListingDetails;
  featured?: boolean;
  events?: TrackEvent[];
}
