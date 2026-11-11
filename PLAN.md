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
- **Pre-launch fixes in review (2026-11-11), all open, none merged.** Merge
  order for the stacked ones: #22 → #24 → #27 (→ #28 draft), #25 → #26,
  #23 → this plan PR. The rest in any order.
  - #18 quick wins: security headers, `/api/listings` removed, cleanup, README.
  - #19 near-empty venue pages noindexed and out of the sitemap (~1,500 left in it).
  - #20 email alert per contact-form submission (needs `RESEND_API_KEY`).
  - #21 privacy policy rewritten for GDPR (needs `OPERATOR` filled in).
  - #22 144 unlicensed cover photos removed (**already live in Postgres**).
  - #24 630 addresses without an unrelated nearby place name (**live**).
  - #25 accessibility: axe finds 0 WCAG 2.1 AA violations on every page type.
  - #26 home page 922 KB → ~190 KB (map data loads on scroll).
  - #27 venue re-check: 42 archived, 38 websites fixed, 3,175 published (**live**).
  - #23 2027 race calendars (calendar-scout session).
- **Wrong map pins (#28, draft).** 458 suspects: pins on a town hall,
  church, post office or town square, or circuits with no mapped track
  nearby (e.g. Sebring, Cadwell Park, Kartplex Area 27). Tooling is ready;
  relocation stopped when OSM rate-limited this machine (Nominatim 429).
  Next: rerun `relocate-approximate-venues.ts --suspects
  data/import/pin-suspects-circuits.csv` once the limit clears (spread over
  days, at 1 request/s), or use a paid geocoder (user's call).
- **Licensed photo run, remaining batches**: batches 05, 10 and 11 are
  partial and 12 is not started (`data/import/photos/batches/`). After it
  finishes: `apply-photo-run.ts`, then sync, then `db:snapshot`.

### Next (launch blockers)
- Merge the PRs above (user).
- Fix the 458 suspect pins (#28). Circuits first: 132.
- **Venues without a website.** In a random sample of 40, 60% were
  confirmed, 0 were wrong, and 40% couldn't be confirmed either way. That
  extrapolates to ~800 of the ~2,100 venues without a website. Verify them in
  verifier batches, or drop the unconfirmable ones (rule 4), or accept them:
  user's call.
- 6 venues with the wrong city (e.g. Vamoen is in Evje, not Kristiansand),
  listed in `verification-report-2026-11-11-sample.md`.
- Set `NEXT_PUBLIC_SITE_URL` and the real domain and contact email (code falls
  back to the Vercel URL).
- "Last verified" date on listings. `verified` is false for all rows, so a
  verification date has to be stored first.
- Photo upload on the Add-your-venue form. The form itself is live (PR #12);
  for now people send links in the message.
- Confirm Sentry receives errors. A test event got 429 "quota or rate
  limit", so the user needs to check Sentry usage.

### Before launch (should fix)
- Self-host the 225 Wikimedia cover photos (they load from
  upload.wikimedia.org). Low risk now that venue-site photos are gone.
- A full Content-Security-Policy (only `frame-ancestors` is set).
- No CI or tests beyond the Vercel build.
- Main checkout: local `master` is behind origin, with uncommitted
  dependency upgrades (Next unpinned to `^16.4.2`). Discard them rather than
  upgrade Next before launch.
- Manual accessibility pass for what axe can't check: screen-reader flow on
  the map, focus order in the search palette.

### Blocked / needs the user
- Supabase free tier auto-pauses after inactivity (it took the site down on
  2026-10-16). Decide on Pro before launch.
- Analytics custom events (PR #7) are only recorded on Vercel Pro.
- Fill in `OPERATOR` (name and postal address) in `lib/site.ts` for the
  privacy policy (#21); probably an imprint page for DE/AT too.
- Create a Resend account and set `RESEND_API_KEY` in Vercel (#20).
- Pins: wait for the OSM limit or approve a paid geocoder.

### Data debt (after launch is fine)
- Opening hours and regional `track-details-*.csv` coverage (regional files
  are subsets of the main one).
- About 20 venues have cities in local script (e.g. Fuji "小山町").
- Kart tracks and sim centres have almost no licensed photos. The plan is
  venue-supplied photos, maybe with a capped Google Places fallback.
- Keep photoIndex-2 rows for a future gallery.

### Done (recent)
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
| PR #18 `claude/launch-quick-wins` | Security headers, bulk API removed, cleanup | merge | 2026-11-11 |
| PR #19 `claude/noindex-thin-listings` | Near-empty venue pages noindexed | merge | 2026-11-11 |
| PR #20 `claude/submission-alerts` | Email per form submission | merge, then set RESEND_API_KEY | 2026-11-11 |
| PR #21 `claude/privacy-policy` | GDPR privacy policy | fill OPERATOR, merge | 2026-11-11 |
| PR #22 `claude/remove-unlicensed-photos` | 144 unlicensed photos removed (live) | merge | 2026-11-11 |
| PR #24 `claude/fix-venue-addresses` | 630 address fixes (live), stacked on #22 | merge after #22 | 2026-11-11 |
| PR #25 `claude/a11y-contrast` | WCAG contrast fixes | merge | 2026-11-11 |
| PR #26 `claude/lighter-home-page` | Home page data loads on scroll, stacked on #25 | merge after #25 | 2026-11-11 |
| PR #27 `claude/verification-fixes` | 42 archived, 38 websites fixed (live), stacked on #24 | merge after #24 | 2026-11-11 |
| PR #28 `claude/fix-misplaced-pins` (draft) | Pin check and relocation tooling, stacked on #27 | run relocation, then ready | 2026-11-11 |
| this PR `claude/plan-update-2026-11-11` | This plan update, stacked on #23 | merge after #23 | 2026-11-11 |
| PR #23 `claude/quizzical-lumiere-30aede` | 2027 race calendars and Formula E 2026–27 (174 events) | merge | opened 2026-11-11 |

## Agent roster

| Agent | Owns | Last run | Last output | Next action |
|---|---|---|---|---|
| team-lead | This plan; cross-agent status | 2026-11-06 | `PLAN.md` | Review at the start of each session and after each agent run |
| venue-scout (+ -africa, -australia, -south-america) | Finding new venues | 2026-09-25 | `data/import/raw/scouted-2026-09-25-*.csv` | Hold until launch blockers are done |
| kart-map-scout | Karting venues and track details from kart-map.com | 2026-09-29 | `raw/kartmap-*-2026-09-29.csv`, `track-details.csv` | None planned |
| venue-verifier | Checking listings still operate | 2026-11-11 | `verification-report-2026-11-11-flagged.md`, `-sample.md` | Venues without a website (~2,100): batches, if the user wants them verified |
| venue-photo-finder | Licensed cover photos | 2026-10 | `photos/batches/batch-11*` | Finish batches 05, 10, 11 and 12 |
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
