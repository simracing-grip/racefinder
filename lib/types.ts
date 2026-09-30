export type Category = "sim_racing" | "track_day" | "karting" | "f1" | "club_only";

export const CATEGORIES: { value: Category; label: string; plural: string; global?: boolean }[] = [
  { value: "sim_racing", label: "Sim Racing", plural: "Sim Racing Centers" },
  { value: "track_day", label: "Track Day", plural: "Track Day Circuits" },
  { value: "karting", label: "Karting", plural: "Karting Tracks" },
  // Unlike the other categories (Europe-only for now), F1 covers every
  // continent the calendar races on — there's no "Europe first" phase-in
  // that makes sense for a fixed list of ~24 circuits.
  { value: "f1", label: "F1", plural: "Formula 1 Circuits", global: true },
  // A modifier, not a replacement: club_only always appears alongside a
  // "real" category (e.g. ["karting", "club_only"]) rather than instead of
  // one, so these venues still show up under Karting/Track Day too. It gets
  // its own CATEGORIES entry purely so it renders as its own filter tab,
  // badge, and /category/club_only page like everything else here — venues
  // with membership required and no public walk-in/hire, found scouting
  // Australia, NZ, Mozambique, Brazil and Argentina.
  { value: "club_only", label: "Club / Members Only", plural: "Club & Members-Only Venues", global: true },
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

// A race-calendar date. Kept out of Listing/generated-listings.ts itself
// (see data/calendar-events.ts) since it needs far more frequent updates
// than venue location data and would otherwise get discarded on the next
// import.
export type EventSeries =
  | "f1"
  | "f2"
  | "f3"
  | "f4"
  | "motogp"
  | "gt3"
  | "gt4"
  | "imsa"
  | "wec"
  | "wrc"
  | "wrc2"
  | "wrc_junior"
  | "nascar"
  | "indycar"
  | "formula_e"
  | "elms"
  | "supercars"
  | "dtm"
  | "btcc"
  | "tcr_europe"
  | "tcr_world_tour"
  | "super_gt"
  | "super_formula"
  | "porsche_supercup"
  | "wkc";

export interface TrackEvent {
  series: EventSeries;
  name: string;
  startDate: string; // ISO date, e.g. "2026-07-26"
  endDate?: string; // ISO date; omit for a single-day event
  season: number;
  sourceUrl?: string;
}

// The full calendar (data/calendar-events.ts) isn't limited to tracks this
// directory lists as venues — MotoGP/IMSA/WEC in particular race well
// outside Europe. `listingSlug` is set only when the circuit is confirmed to
// be the same physical venue as one of our listings, which is how
// lib/listings.ts attaches events to a Listing's `events` field.
export interface CalendarEvent extends TrackEvent {
  circuitName: string;
  city: string;
  country: string;
  countryCode?: string;
  listingSlug?: string;
}

// Attribution for a listing's cover photo (data/photo-credits.ts). Wikimedia
// photos carry author + license (CC BY/BY-SA require showing both); photos
// from venue/tourism sites only have the page they came from.
export interface PhotoCredit {
  imageUrl: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
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
  coverImageCredit?: PhotoCredit;
  googleMapsUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  indoorOutdoor?: IndoorOutdoor;
  trackLengthM?: number;
  openingHours?: string;
  details?: ListingDetails;
  featured?: boolean;
  events?: TrackEvent[];
}

// What the browser gets for lists, maps and search (see toSummary in
// lib/listingSummary.ts): enough to draw a pin, a row and a search hit, with
// only the next upcoming event. Full details load on demand from
// /api/listings/[slug] — sending every field for 3,500 venues made the home
// page ~3 MB.
export type ListingSummary = Pick<
  Listing,
  "slug" | "name" | "categories" | "country" | "countryCode" | "city" | "lat" | "lng" | "coverImageUrl" | "featured" | "events"
>;
