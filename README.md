# RaceFinder — European Motorsport Directory

A directory + map of sim racing centers, track day circuits, and karting tracks,
starting with Europe. Next.js + Tailwind now, with Supabase (Postgres + Auth)
and Drizzle scaffolded in for when accounts/payments/moderation get added.

Full plan: see the project plan doc from the planning session (roadmap, data
model rationale, and phased monetization approach).

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The site currently reads
from `data/placeholder-listings.ts` — 9 example venues — until your real data
is imported (below).

## Getting your real listings in

The 62 saved locations live in Google Maps and need to be exported and
categorized. Two steps:

### 1. Export from Google Takeout

1. Go to [takeout.google.com](https://takeout.google.com) signed into the
   Google account with the saved places.
2. Click **Deselect all**, then find and check **"Maps (your places)"**.
3. **Next step** → delivery "Send download link via email", frequency
   "Export once", file type `.zip` → **Create export**.
4. You'll get an email with a download link, usually within minutes.
5. Unzip it and look under `Takeout/Maps/`:
   - Each **named list** (e.g. a custom "Track days" or "Karting" list)
     exports as its own CSV with `Title`, `Note`, `URL` columns.
   - The default **"Saved places"** list (things you bookmarked without
     adding to a named list) exports as `Saved Places.json` — a GeoJSON
     file, not a CSV.
6. Copy the CSV file(s) and/or `Saved Places.json` into `data/import/raw/`
   in this project. The parse step (below) reads both formats from that
   folder in the same pass.

> `Saved Places.json` entries don't always carry a name or resolved
> coordinates — Google sometimes only records the `google_maps_url` you
> saved. The parser falls back to that URL's place name / address and, if
> coordinates are missing, forward-geocodes the address via Nominatim. Rows
> it can't resolve at all are skipped with a console warning — check those
> manually. Because this list isn't curated the way a named list is, expect
> to weed out non-motorsport pins in `review.csv` before loading.

### Alternative: importing from a shared Google Maps list

If your places live in a public/shared Google Maps list (Save → a list →
Share) rather than your private Takeout export, there's no clean API to pull
it programmatically — Google Maps' list pages don't expose per-item
coordinates in a scrapable way. The practical approach: read the list's name
+ venue-type text (visible in the shared-list page) and forward-geocode each
place by name instead of relying on a URL.

Create `data/import/raw/<any-name>.csv` with these columns:

```
Title,VenueType,Rating,ReviewCount
Nürburgring,Car racing venue,4.8,46864
```

`VenueType` is Google's own category label for the place (e.g. "Go-karting
venue", "Car racing venue", "Racecourse") — it's mapped straight to
karting/track_day, which is more reliable than guessing from the name alone.
Anything without a clean mapping (a "Sports complex", "Club", "Training
center", etc., or no venue type at all) still gets imported but flagged
`needsReview=yes` in `review.csv` so you decide whether to keep, recategorize,
or drop it. Because there's no per-place URL here, coordinates come from
geocoding the name itself (Nominatim) — accurate for well-known/uniquely
named venues, worth double-checking for generic ones (a bare "Monza" could in
principle resolve to the town rather than the kart track), so review the
resulting `lat`/`lng`/`address` columns too.

### 2. Parse, enrich, and review

```bash
npm run import:parse
```

This resolves each place's Google Maps URL to real coordinates, reverse-geocodes
an address/city/country for free via OpenStreetMap's Nominatim API, and guesses
a category (sim_racing / track_day / karting) from the place name. It writes
`data/import/review.csv`.

**Open that CSV in Excel or Google Sheets** and do a quick pass (should take
20-30 minutes for ~62 rows, since these are places you already know):
- Confirm/fix the `categories` column — pipe-separated if a venue is more than
  one (e.g. `track_day|karting`).
- Look at every row with `needsReview=yes` first — these are either
  uncategorized or a venue type (sports complex, club, training center, kids'
  amusement center, etc.) that doesn't map cleanly to one of the 3 categories.
- Fill in `websiteUrl` / `phone` / `description` where you know them.
- Delete any rows that shouldn't be published.

Then load it:

```bash
npm run import:load
```

This writes `data/generated-listings.ts` with your real data. Point
`lib/listings.ts` at it (swap the import from `@/data/placeholder-listings`
to `@/data/generated-listings`) to go live with real listings.

If `DATABASE_URL` is set (see below), this also upserts the same data straight
into Postgres.

## Connecting Supabase (Postgres + Auth) — optional until you need accounts

Not required to browse the site with placeholder or generated-file data. Set
it up when you're ready for business-owner accounts, an admin moderation
queue, or paid featured listings:

1. Create a free project at [supabase.com](https://supabase.com).
2. Project Settings → API: copy the URL and anon key into `.env.local`
   (copy `.env.example` first) as `NEXT_PUBLIC_SUPABASE_URL` /
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Project Settings → Database → Connection string ("Transaction" pooler):
   copy into `.env.local` as `DATABASE_URL`.
4. `npm run db:generate` then `npm run db:migrate` to create the schema
   (`lib/db/schema.ts`) in your Supabase Postgres instance.
5. Re-run `npm run import:load` to upsert your real listings into the DB.

## Deploying

Push this repo to GitHub, then import it on [vercel.com](https://vercel.com)
(free Hobby tier). Add the same env vars from `.env.local` in the Vercel
project settings. A custom domain can be added later from the Vercel
dashboard once you've bought one.
