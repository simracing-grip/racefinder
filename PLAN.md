# RaceFinder: main plan

The single source of truth for what we're building, what's in flight, and
who is doing what. The **team-lead** agent (`.claude/agents/team-lead.md`)
reads this before any work, reconciles it against git, PRs and agent output,
and keeps it current. Edit it freely. The team lead edits in place and keeps
your changes.

Last reviewed: 2026-11-06

## Goal

Launch RaceFinder publicly: a directory and map of karting tracks, track-day
circuits and sim racing centres, starting with Europe and now worldwide. The
launch bar is about 99% listing accuracy, a working outage fallback, and
error and analytics monitoring that actually receives data.

## Status board

### Now (in flight)
- **Rescue 34 dropped venues**: branch `claude/rescue-dropped-venues` (1
  commit, 2026-11-02, **no PR**). Next: open the PR, merge it (needs the
  user's yes), sync, then `db:snapshot`.
- **Licensed photo run, remaining batches**: batches 05, 10 and 11 are
  partial and 12 is not started (`data/import/photos/batches/`). After it
  finishes: `apply-photo-run.ts`, then sync, then `db:snapshot`.

### Next (launch blockers)
- Set `NEXT_PUBLIC_SITE_URL` and the real domain and contact email (code falls
  back to the Vercel URL).
- Report-a-problem link and a "last verified" date on listings.
- Photo upload on the Add-your-venue form. The form itself is live (PR #12);
  for now people send links in the message.
- Accessibility check (WCAG 2.1 AA pass).
- Confirm Sentry receives errors. A test event got 429 "quota or rate
  limit", so the user needs to check Sentry usage.

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
| `claude/rescue-dropped-venues` (no PR) | Restore 34 venues with confirmed locations | PR → merge → sync → snapshot | 4 days |

## Agent roster

| Agent | Owns | Last run | Last output | Next action |
|---|---|---|---|---|
| team-lead | This plan; cross-agent status | 2026-11-06 | `PLAN.md` | Review at the start of each session and after each agent run |
| venue-scout (+ -africa, -australia, -south-america) | Finding new venues | 2026-09-25 | `data/import/raw/scouted-2026-09-25-*.csv` | Hold until launch blockers are done |
| kart-map-scout | Karting venues and track details from kart-map.com | 2026-09-29 | `raw/kartmap-*-2026-09-29.csv`, `track-details.csv` | None planned |
| venue-verifier | Checking listings still operate | 2026-09-15 | `verification-report-2026-09-15.md` | Re-verify before launch (report is 7+ weeks old) |
| venue-photo-finder | Licensed cover photos | 2026-10 | `photos/batches/batch-11*` | Finish batches 05, 10, 11 and 12 |
| venue-social-finder | Instagram, Facebook and TikTok links | 2026-09-27 | `social-links.csv` | None planned |
| calendar-scout | Race calendars → `data/calendar-events.ts` | 2026-10-26 | `calendar-events.ts` (2027 F1) | Refresh when the 2027 calendars of other series are published |

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
