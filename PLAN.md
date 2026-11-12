# RaceFinder: main plan

The single source of truth for what we're building, what's in flight, and
who is doing what. The **team-lead** agent (`.claude/agents/team-lead.md`)
reads this before any work, reconciles it against git, PRs and agent output,
and keeps it current. Edit it freely. The team lead edits in place and keeps
your changes.

Last reviewed: 2026-11-11

## Goal

Launch RaceFinder publicly: a directory and map of karting tracks, track-day
circuits and sim racing centres, starting with Europe and now worldwide. The
launch bar is about 99% listing accuracy, a working outage fallback, and
error and analytics monitoring that actually receives data.

## Status board

### Now (in flight)
- **#40 in review**: track layout drawings on circuit venue pages (from OSM raceways in the map tiles). #18–#39 are merged and live, including the map restyle (#39: brand colours, red track outlines on the map).

### Next (launch blockers)
- Merge the PRs above (user).
- **Venues without a website.** In a random sample of 40, 60% were
  confirmed, 0 were wrong, and 40% couldn't be confirmed either way. That
  extrapolates to ~800 of the ~2,100 venues without a website. Verify them in
  verifier batches, or drop the unconfirmable ones (rule 4), or accept them:
  user's call.
- **Pins still to review: 3 circuits and 56 karting/sim** (2026-11-12, twelfth pass: 40 moved, 18 archived; the rest have no mapped track or online address)
  (`data/import/pin-check-2026-11-11.md`). Run batch B through Nominatim on
  another day (rule 8) and read its matches by hand (the name matching is
  loose: batch A matched a playground and a music school).
- Look at the 90 hits of `find-name-town-mismatches.ts`: most are suburbs,
  but the first pass found 6 pins 6–200 km off this way.
- Set `NEXT_PUBLIC_SITE_URL` and the real domain and contact email (code falls
  back to the Vercel URL).
- Photo upload on the Add-your-venue form. The form itself is live (PR #12);
  for now people send links in the message.
- Confirm Sentry receives errors. A test event got 429 "quota or rate
  limit", so the user needs to check Sentry usage.

### Before launch (should fix)
- Self-host the 263 Wikimedia cover photos (they load from
  upload.wikimedia.org, which rate-limits generic clients).
- Main checkout: local `master` is behind origin, with uncommitted
  dependency upgrades (Next unpinned to `^16.4.2`). Discard them rather than
  upgrade Next before launch.
- Manual accessibility pass for what axe can't check: screen-reader flow on
  the map, focus order in the search palette.
- Tests: unit + data-integrity tests run in CI (#34); no end-to-end tests yet.

### Blocked / needs the user
- Supabase free tier auto-pauses after inactivity (it took the site down on
  2026-10-16). Decide on Pro before launch.
- Analytics custom events (PR #7) are only recorded on Vercel Pro.
- Fill in `OPERATOR` (name and postal address) in `lib/site.ts` for the
  privacy policy; probably an imprint page for DE/AT too.
- Create a Resend account and set `RESEND_API_KEY` in Vercel (contact-form
  emails are off until then).
- Venues without a website: verify, drop or accept (see Next).

### Data debt (after launch is fine)
- Opening hours and regional `track-details-*.csv` coverage (regional files
  are subsets of the main one).
- About 20 venues have cities in local script (e.g. Fuji "小山町").
- Kart tracks and sim centres have almost no licensed photos. The plan is
  venue-supplied photos, maybe with a capped Google Places fallback.
- Keep photoIndex-2 rows for a future gallery.

### Done (recent)
- PR #39: map restyled (blue-black palette, OSM raceways drawn in red, venue maps open at zoom 13).
- PR #16: snapshot refreshed after the rescue sync (3,217 rows).
- PR #14: 34 dropped venues rescued, synced on 2026-11-11 (3,217 published),
  snapshot refreshed.
- PR #13 and #15: team-lead agent and this plan.
- PR #12: venue submission form on /contact, plus migration 0003
  (`submissions` table and RLS). Live test passed on 2026-11-02.
- PR #10 and #11: 164 licensed circuit photos (368 venues have photos);
  snapshot refreshed.
- PR #8 and #9: 11 duplicate venues merged, with redirects; snapshot refreshed.
- PR #7: launch analytics events.
- PR #6: track-details sync no longer wipes data; opening hours shown.
- PR #2–#5: DB-outage fallback, calendar links, 2027 F1, a11y/SEO, data
  cleanup; 3,194 published.

## Open branches & PRs

| Branch / PR | What | Step left | Age |
|---|---|---|---|
| PR #40 `claude/track-outlines` | Track layout card on venue pages, outline builder, this plan update | merge | 2026-11-12 |

## Agent roster

| Agent | Owns | Last run | Last output | Next action |
|---|---|---|---|---|
| team-lead | This plan; cross-agent status | 2026-11-06 | `PLAN.md` | Review at the start of each session and after each agent run |
| venue-scout (+ -africa, -australia, -south-america) | Finding new venues | 2026-09-25 | `data/import/raw/scouted-2026-09-25-*.csv` | Hold until launch blockers are done |
| kart-map-scout | Karting venues and track details from kart-map.com | 2026-09-29 | `raw/kartmap-*-2026-09-29.csv`, `track-details.csv` | None planned |
| venue-verifier | Checking listings still operate | 2026-11-11 | `verification-report-2026-11-11-flagged.md`, `-sample.md` | Venues without a website (~2,100): batches, if the user wants them verified |
| venue-photo-finder | Licensed cover photos | 2026-11-11 | `photos/batches/batch-12*` | Circuit run done (batches 01–12); karting/sim photos not started |
| venue-social-finder | Instagram, Facebook and TikTok links | 2026-09-27 | `social-links.csv` | None planned |
| calendar-scout | Race calendars → `data/calendar-events.ts` | 2026-11-11 | `calendar-events.ts` (2027 for 14 series and Formula E 2026–27, PR #23) | Merge PR #23. Around Jan 2027, re-run for the unpublished series, the 12 WRC and 3 Junior WRC host cities, and BTCC Oulton Park |

## Standing rules

1. **After any import or sync, run `npm run db:snapshot` and commit.**
   Otherwise the outage fallback (`data/listings-snapshot.json`) goes stale.
2. Never hand-edit `data/generated-listings.json`. Change the source CSV and
   re-run the import.
3. Photos come from licensed sources only (Wikimedia Commons, CC, or photos
   the venue supplied).
4. When a venue can't be confirmed, drop it rather than keep it. The bar is
   about 99% accuracy.
5. Agents commit, push and open PRs on their own. **Merging to master,
   settings changes and anything paid need the user's explicit yes.**
6. `data/import/raw/` and `data/import/*.csv` are git-ignored and live only
   in the main checkout, not in worktrees.
7. One writer per set of files. Two agents never edit the same file at once.
8. Public OSM services (Nominatim, Overpass) are for light use: at most 1
   request/s, and no bulk runs of thousands in a day. They rate-limited this
   machine on 2026-11-11. Cache answers and spread big runs over days.

## Progress log

- **2026-11-06**: Plan created. It is seeded from git (PRs #2–#12 merged,
  master at `a197bdd`), the photo batch files, and the launch notes. One
  unmerged branch has no PR: `claude/rescue-dropped-venues`.
- **2026-11-10**: PR #13 (team-lead agent and PLAN.md) merged as `de8cf75`.
  PR #14 opened for the 34 rescued venues; a test merge with master gives
  3,217 venues, no duplicate slugs or ids, and all 368 photos kept. One
  rescued venue (`the-race-lounge-star-city-birmingham`) brings back a photo
  from the venue's own site, which is in the licensing-risk group.
- **2026-11-11**: PR #14 merged as `2e7986b`, after merging master into the
  branch: its Vercel preview had failed because the branch predated the
  outage fallback. PR #15 merged as `b76830c`. A dry run against the database
  found 0 rows to archive and 34 archived rows to revive. The sync then
  upserted 3,217 rows, archived 0, and left 3,217 published. The snapshot was
  re-exported (3,217 rows). Tip: run DB scripts from a worktree with
  `DOTENV_CONFIG_PATH=<main checkout>/.env`.
- **2026-11-11**: PR #16 (snapshot refresh) merged as `9c03a55`. A
  pre-launch review of the code, data and live site added five launch
  blockers: wrong addresses, a calendar that empties in December, form
  submissions that notify nobody, privacy policy gaps, and thin listings. It
  also added a "Before launch (should fix)" list. The report-a-problem link
  was already live, so only "last verified" is left from that item.
- **2026-11-11**: calendar-scout ran in four batches for the 2027 calendars.
  PR #23 adds 174 events to `data/calendar-events.ts` (316 → 490). Each
  series was checked against its official page.
  - Series added: Formula E 2026–27 (21), MotoGP (22), WEC (9), ELMS (6),
    IMSA (11), GT World Challenge Europe (10), GT4 European Series (6),
    DTM (8), BTCC (9), WRC (3), Junior WRC (2), NASCAR (36), IndyCar (17),
    Supercars (14).
  - Ten series have no published 2027 dates yet; they are listed in the PR.
  - Checks: no duplicate event ids, every `listingSlug` exists, and
    `next build` passes locally.
  - Pre-existing: the 2026 WKC Le Mans entry links a slug that isn't a
    listing (`le-mans-karting-international`).
- **2026-11-11**: Pre-launch fixes, done in one session (no team-lead agent
  available there). PRs #18–#22, #24–#28 opened; nothing merged.
  - Addresses: Nominatim reverse-geocoded 2,259 pins; 591 automatic + 39
    hand-picked fixes (`address-fixes.csv`, `sync-address-fixes.ts`), live.
  - Photos: 160 non-Commons cover rows cleared in Postgres (144 published),
    backup in `cover-images-cleared-2026-11-11.csv`, live.
  - Verification: all 1,095 websites fetched (`check-venue-websites.ts`),
    venue-verifier on 43 suspects + 40 random no-website venues. 42 archived
    (`verification-drops-2026-11-11.csv`, merged into `location-fixes.csv`),
    38 websites fixed (`website-fixes.csv`), live. Published: 3,175.
  - Pins: 458 suspects in `pin-suspects*.csv`; relocation blocked by the
    OSM rate limit (see rule 8).
  - All PRs merged together locally: build OK, axe 0 violations on every
    page type, noindex/sitemap/headers/privacy checked on `next dev`.
- **2026-11-11 (later)**: #18–#27 and #29 merged by the user; production
  deploy checked (headers, 404 on `/api/listings`, sitemap 1,488 venues,
  privacy page, 2027 calendar). Then, in the same session:
  - Pins: Nominatim still 429, so `wikidata-circuit-pins.ts` checks with
    Wikidata + Photon (komoot's OSM search). 49 circuits + 63 karting/sim
    + Kartarena Cheb moved (live, merged into `location-fixes.csv`), every
    move read by hand. The 6 "wrong city" venues are settled (Cheb fixed,
    2 already archived, Vamoen, Hawke's Bay and Zhejiang see #28).
  - Photos: batches 05, 10, 11, 12 finished by two venue-photo-finder
    agents; 37 new covers live; 27 checked by eye on a contact sheet.
  - CSP + CI (#30). The first CI run found that link-preview images crash
    the build when Google Fonts times out; fixed in the same PR.
  - "Website checked" date (#31) from the website check, no DB change.
  - Wikimedia also rate-limits generic clients (429 on thumbnails); keep
    bulk image fetches slow, like rule 8.
- **2026-11-11 (evening)**: #28, #30–#33 merged; production checked (CSP
  header, Sebring's new address, Salzburgring photo, OG images, CI green).
  Then #34: 13 circuits by OSM name match, 17 by Nominatim (its limit had
  cleared), 6 by hand from the new `find-name-town-mismatches.ts` (pins
  in a same-named place elsewhere: Circuit Bugatti, Speed Park Le Mans,
  Mores, Abruzzo, Varano, Cairns). Arizona Motorsports Park archived
  (sold, last event March 2025). Albany duplicate merged. All 37 new cover
  photos now checked by eye. `npm test` added; it caught a calendar event
  linking a venue that doesn't exist. Published: 3,173.
- **2026-11-11 (night)**: #34 merged. Third and fourth pin passes (#35):
  12 circuits by Wikidata + any mapped track near its point (many are
  mapped only under local-script names), 19 circuits by hand (Autopolis
  31 km, Hunan/Zhuzhou ~100 km, Franciacorta 44 km, Dragon Race Track in the
  wrong Kaloyanovo ~150 km, Fangio autodrome in Rafaela instead of Rosario),
  32 karting/sim from Nominatim batch A after reading every match (4
  rejected). Batch B (128) left for another day.
- **2026-11-11 (late night)**: #35 merged. Fifth pass (#36): Le Mans
  Karting International restored (archived on 2026-10-01 with a creperie
  pin; now on Circuit Alain Prost) and the WKC KZ round relinked; new
  `add-manual-venues.ts` adds or restores venues, since a full re-import no
  longer reproduces generated-listings.json. Circuits: Donnybrook (13 km),
  South Chiba (12 km, was Ichihara City Hall), Link Circuit, Sudamericano
  moved; NanoCircuit, Juan C. Ferrer and Afonso Petschow dropped (nothing
  confirms them); Esperance listed twice, merged. Karting/sim batch A: 8
  more moved by Photon name match, each checked against the venue's own
  address. Overpass was down (502) all evening. Published: 3,170.
- **2026-11-11 (late night, 2)**: #36 merged while GitHub Actions was in a
  major outage; lint, tests and build were run locally first. Sixth pass
  (#37): 25 karting/sim pins from batch A moved by looking up each venue's
  own address and geocoding it (US, Canada, Japan, Brazil, Loxton); 5 of
  them are district-level where the track isn't mapped (noted in the
  evidence). PowerPlay Kansas City archived: closed 30 Aug 2026. Published:
  3,169.
- **2026-11-11 (late night, 3)**: #37 merged. Seventh pass (#38): 9 more
  karting pins fixed by their own addresses (Ingolstadt, Walldorf,
  Landsberg, Riga, Chauray, Champniers, Belica, Quinssaines, Carmona).
  Archived: Pınarbaşı İzmir (closed 2022, demolished), Kartxxl UG and AQVA
  Kart (no sign either is a kart track). Karting-Belval checked and kept.
  Published: 3,166.
- **2026-11-12**: #38 and #39 merged (map restyle: brand palette, red
  raceway outlines, venue maps at zoom 13). Track layouts (#40): new
  `build-track-outlines.ts` reads OSM raceways from the OpenFreeMap z14
  tiles around each pin, joins touching lines into tracks, picks the
  circuit (longest within 1.5 km for f1/track_day), simplifies it into an
  SVG path in `data/track-outlines.json`; the venue page shows it as a
  "Track layout" card with OSM credit. 373 of 476 f1/track_day venues
  have one; all were checked by eye on contact sheets, and 13 were left out
  (street circuits such as Monaco and Baku, fragments; listed in EXCLUDE).
  Karting outlines are a possible next run. Batch B (128 karting/sim) run
  through Nominatim.
- **2026-11-12 (later)**: #40–#42 merged (track layouts live, batch B pins
  live, builder skips incomplete tracks). Kart layouts: the builder now
  takes the nearest raceway within 250 m for kart venues (not longer than
  3 km), skips known indoor venues, and skips any drawing that is less than
  60% closed loop (open lines, fragments). 233 kart tracks drawn and
  checked by eye; 606 track layouts in total.
- **2026-11-12 (night)**: #47 merged. Twelfth pin pass over the 114
  karting/sim pins still in review. Each venue's address was searched on
  the web, then checked against the map (OpenFreeMap tiles, because Photon
  and Overpass were down or overloaded). 40 moved: 30 onto a named or
  unique mapped kart track, 10 to an address, street or postcode. 18
  archived: 2 closed (Gela, Kenjeran) and 16 with no trace online, no
  website or phone, and no kart track mapped near the pin. 25 new kart
  layouts (615 → 640; 3 bad drawings excluded). 3,148 published. 56
  karting/sim and 3 circuits still in review.
