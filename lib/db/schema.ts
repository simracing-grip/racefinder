import {
  pgTable,
  uuid,
  text,
  boolean,
  numeric,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "pending",
  "published",
  "archived",
]);

export const listingSourceEnum = pgEnum("listing_source", [
  "seed_import",
  "user_submission",
  "owner_submission",
]);

export const indoorOutdoorEnum = pgEnum("indoor_outdoor", [
  "indoor",
  "outdoor",
  "both",
]);

export const userRoleEnum = pgEnum("user_role", ["user", "owner", "admin"]);

// categories lives as text[] rather than a join table: cheap to query with
// Postgres array operators (`@>`, `&&`) at this data size and avoids a join
// on every listing/filter query.
export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  categories: text("categories").array().notNull(),
  status: listingStatusEnum("status").notNull().default("draft"),
  source: listingSourceEnum("source").notNull().default("seed_import"),
  verified: boolean("verified").notNull().default(false),
  claimedBy: uuid("claimed_by"), // FK -> auth.users, added once Supabase Auth is wired up

  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  region: text("region"),
  city: text("city").notNull(),
  address: text("address").notNull(),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),

  websiteUrl: text("website_url"),
  phone: text("phone"),
  email: text("email"),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  googleMapsUrl: text("google_maps_url"),

  indoorOutdoor: indoorOutdoorEnum("indoor_outdoor"),
  trackLengthM: numeric("track_length_m", { precision: 8, scale: 1 }),

  // category-specific attributes (simulator_count, kart_type, track_config_variants, ...)
  // kept schemaless here and validated with Zod at the app layer (lib/validation/listing.ts)
  // so new attributes never require a migration.
  details: jsonb("details"),

  featured: boolean("featured").notNull().default(false),
  featuredUntil: timestamp("featured_until", { withTimezone: true }),

  viewCount: integer("view_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const listingImages = pgTable("listing_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Reserved for Phase 3 (lead-gen contact/booking forms) — table exists now so
// the schema doesn't need a migration when that feature is built.
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Reserved for Phase 3 (paid featured listings via Stripe).
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull().default("inactive"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
