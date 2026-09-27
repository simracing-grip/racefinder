CREATE TYPE "public"."indoor_outdoor" AS ENUM('indoor', 'outdoor', 'both');--> statement-breakpoint
CREATE TYPE "public"."listing_source" AS ENUM('seed_import', 'user_submission', 'owner_submission');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'pending', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'owner', 'admin');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"categories" text[] NOT NULL,
	"status" "listing_status" DEFAULT 'draft' NOT NULL,
	"source" "listing_source" DEFAULT 'seed_import' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"claimed_by" uuid,
	"country" text NOT NULL,
	"country_code" text NOT NULL,
	"region" text,
	"city" text NOT NULL,
	"address" text NOT NULL,
	"lat" numeric(9, 6) NOT NULL,
	"lng" numeric(9, 6) NOT NULL,
	"website_url" text,
	"phone" text,
	"email" text,
	"description" text,
	"cover_image_url" text,
	"google_maps_url" text,
	"indoor_outdoor" "indoor_outdoor",
	"track_length_m" numeric(8, 1),
	"details" jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_customer_id" text,
	"status" text DEFAULT 'inactive' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;