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
- **Licensed photo run, remaining batches**: batches 05, 10 and 11 are
  partial and 12 is not started (`data/import/photos/batches/`). After it
  finishes: `apply-photo-run.ts`, then sync, then `db:snapshot`.

### Next (launch blockers)
- **Wrong venue addresses.** Many addresses start with the nearest unrelated
  place, picked up when addresses were looked up from map pins (Hockenheimring
  "Hotel Motodrom", Sebring "Gavaghan's Irish Pub", Kartplex "Subway"). At
  least 74 are obvious and about 1,000 more need a look. They show on the
  page and in the JSON-LD. Pins are fine; Directions uses lat/lng.
- **Race calendar empties in December.** Only F1 has 2027 dates. 24 of 25
  series have no races after early December, and Formula E 2026–27 is
  missing. Run calendar-scout for 2027.
- **Form submissions notify nobody.** They go to the `submissions` table
  with no email or alert. Add a notification and a review routine.
- **Privacy policy gaps (GDPR).** Doesn't mention Sentry, Supabase,
  photos loaded from about 140 venue sites and Wikimedia, or the Garage
  (localStorage). No operator, retention period or user rights. Consider an
  imprint page for DE/AT visitors.
- **Thin listings.** 2,006 of 3,217 have no website, phone, photo or
  description. Noindex them and leave them out of the sitemap until enriched,
  or run an enrichment pass.
- Set `NEXT_PUBLIC_SITE_URL` and the real domain and contact email (code falls
  back to the Vercel URL).
- "Last verified" date on listings. The report-a-problem link is already
  live. `verified` is false for all 3,217 rows, so a verification date has
  to be stored first.
- Photo upload on the Add-your-venue form. The form itself is live (PR #12);
  for now people send links in the message.
- Accessibility check (WCAG 2.1 AA pass).
- Confirm Sentry receives errors. A test event got 429 "quota or rate
  limit", so the user needs to check Sentry usage.

### Before launch (should fix)
- Self-host cover photos. About 144 load straight from venue websites and can
  break or be blocked at any time.
- `/api/listings` returns all 3,217 venues (1.6 MB, about 3.5 s, uncached)
  to anyone, and the site doesn't use it (only `/api/listings/[slug]`).
  Remove it or cache it.
- Security headers: only HSTS is sent. Add `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy` in
  `next.config.ts`.
- Home page HTML is 960 KB (185 KB gzipped). On a phone the lower half of
  the first screen loaded empty; check that search shows above the fold.
- Cleanup: create-next-app SVGs in `public/`, outdated README ("9
  placeholder venues", "62 saved locations"), no CI or tests.
- Main checkout: local `master` is behind origin, with uncommitted
  dependency upgrades (Next unpinned to `^16.4.2`). Discard them rather than
  upgrade Next before launch. ESLint there also scans other worktrees'
  `.next` output; add `.claude/**` to its ignores.

### Blocked / needs the user
- Supabase free tier auto-pauses after inactivity (it took the site down on
  2026-10-16). Decide on Pro before launch.
- Analytics custom events (PR #7) are only recorded on Vercel Pro.
- About 155 venue-site photos in `cover-images.csv` are a legal risk. Remove
  them or get permission.

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
| `claude/pre-launch-review-3a9d12` | Pre-launch review findings added to this plan | merge | opened 2026-11-11 |

## Agent roster

| Agent | Owns | Last run | Last output | Next action |
|---|---|---|---|---|
| team-lead | This plan; cross-agent status | 2026-11-06 | `PLAN.md` | Review at the start of each session and after each agent run |
| venue-scout (+ -africa, -australia, -south-america) | Finding new venues | 2026-09-25 | `data/import/raw/scouted-2026-09-25-*.csv` | Hold until launch blockers are done |
| kart-map-scout | Karting venues and track details from kart-map.com | 2026-09-29 | `raw/kartmap-*-2026-09-29.csv`, `track-details.csv` | None planned |
| venue-verifier | Checking listings still operate | 2026-09-15 | `verification-report-2026-09-15.md` | Re-verify before launch (report is 7+ weeks old) |
| venue-photo-finder | Licensed cover photos | 2026-10 | `photos/batches/batch-11*` | Finish batches 05, 10, 11 and 12 |
| venue-social-finder | Instagram, Facebook and TikTok links | 2026-09-27 | `social-links.csv` | None planned |
| calendar-scout | Race calendars → `data/calendar-events.ts` | 2026-10-26 | `calendar-events.ts` (2027 F1) | **Before launch:** add the 2027 calendars of the other series, and Formula E 2026–27 |

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
