import { z } from "zod";

export const categorySchema = z.enum(["sim_racing", "track_day", "karting", "f1"]);

export const simRacingDetailsSchema = z.object({
  simulator_count: z.number().optional(),
  simulator_platforms: z.array(z.string()).optional(),
  motion_rig: z.boolean().optional(),
  vr_available: z.boolean().optional(),
  booking_type: z.enum(["walk_in", "reservation_required", "both"]).optional(),
});

export const trackDayDetailsSchema = z.object({
  track_config_variants: z.array(z.string()).optional(),
  car_hire_available: z.boolean().optional(),
  passenger_laps_available: z.boolean().optional(),
  noise_restrictions: z.string().optional(),
  operators: z.array(z.string()).optional(),
  fia_grade: z.string().optional(),
});

export const kartingDetailsSchema = z.object({
  kart_type: z.enum(["petrol", "electric", "both"]).optional(),
  max_kart_speed_kmh: z.number().optional(),
  min_age_or_height: z.string().optional(),
  league_available: z.boolean().optional(),
});

export const listingDetailsSchema = z.object({
  sim_racing: simRacingDetailsSchema.optional(),
  track_day: trackDayDetailsSchema.optional(),
  karting: kartingDetailsSchema.optional(),
});

export const listingSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  categories: z.array(categorySchema).min(1),
  status: z.enum(["draft", "pending", "published", "archived"]).default("published"),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  city: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  websiteUrl: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  googleMapsUrl: z.string().url().optional(),
  indoorOutdoor: z.enum(["indoor", "outdoor", "both"]).optional(),
  trackLengthM: z.number().optional(),
  details: listingDetailsSchema.optional(),
});

export type ValidatedListing = z.infer<typeof listingSchema>;
