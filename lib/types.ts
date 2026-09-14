export type Category = "sim_racing" | "track_day" | "karting";

export const CATEGORIES: { value: Category; label: string; plural: string }[] = [
  { value: "sim_racing", label: "Sim Racing", plural: "Sim Racing Centers" },
  { value: "track_day", label: "Track Day", plural: "Track Day Circuits" },
  { value: "karting", label: "Karting", plural: "Karting Tracks" },
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
}
