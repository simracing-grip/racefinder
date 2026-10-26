CREATE TYPE "public"."submission_kind" AS ENUM('new_venue', 'correction', 'owner');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('new', 'accepted', 'rejected', 'spam');--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "submission_kind" NOT NULL,
	"status" "submission_status" DEFAULT 'new' NOT NULL,
	"venue_slug" text,
	"venue_name" text NOT NULL,
	"categories" text[],
	"city" text,
	"country" text,
	"website_url" text,
	"message" text NOT NULL,
	"contact_name" text,
	"contact_email" text NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Holds visitors' email addresses: lock it away from Supabase's public
-- (anon/authenticated) API. No policies = no access through it; the site
-- writes through its own Postgres connection, which isn't subject to RLS.
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
-- Same for the existing tables (Supabase's security advisor flags any public
-- table without RLS). The site only uses its own Postgres connection.
ALTER TABLE "listings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "listing_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
