// Checks on the committed data files, so a bad import or sync fails CI
// instead of reaching the site. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Listing } from "../lib/types";
import { CATEGORIES } from "../lib/types";
import { MERGED_VENUES } from "../data/merged-venues";
import { WEBSITE_CHECKED } from "../data/website-checked";
import { PHOTO_CREDITS } from "../data/photo-credits";
import { CALENDAR_EVENTS } from "../data/calendar-events";

const listings: Listing[] = JSON.parse(readFileSync("data/generated-listings.json", "utf-8"));
const snapshotRaw = JSON.parse(readFileSync("data/listings-snapshot.json", "utf-8"));
const snapshot: Listing[] = Array.isArray(snapshotRaw) ? snapshotRaw : snapshotRaw.listings;
const slugs = new Set(listings.map((l) => l.slug));
const categories = new Set<string>(CATEGORIES.map((c) => c.value));

test("listings: unique slugs, sane fields", () => {
  assert.ok(listings.length > 3000, `only ${listings.length} listings`);
  assert.equal(slugs.size, listings.length, "duplicate slugs");
  for (const l of listings) {
    assert.match(l.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug ${l.slug}`);
    assert.ok(l.name?.trim(), `${l.slug}: no name`);
    assert.ok(l.city?.trim() && l.country?.trim(), `${l.slug}: no city/country`);
    assert.ok(Number.isFinite(l.lat) && Math.abs(l.lat) <= 90, `${l.slug}: lat ${l.lat}`);
    assert.ok(Number.isFinite(l.lng) && Math.abs(l.lng) <= 180, `${l.slug}: lng ${l.lng}`);
    assert.ok(!(l.lat === 0 && l.lng === 0), `${l.slug}: pin at 0,0`);
    assert.ok(l.categories.length > 0 && l.categories.every((c) => categories.has(c)), `${l.slug}: categories ${l.categories}`);
    if (l.websiteUrl) assert.match(l.websiteUrl, /^https?:\/\//, `${l.slug}: website ${l.websiteUrl}`);
  }
});

test("snapshot (the outage fallback) matches generated-listings", () => {
  const snapSlugs = new Set(snapshot.map((l) => l.slug));
  const missing = [...slugs].filter((s) => !snapSlugs.has(s));
  const extra = [...snapSlugs].filter((s) => !slugs.has(s));
  assert.deepEqual(
    { missing: missing.slice(0, 10), extra: extra.slice(0, 10) },
    { missing: [], extra: [] },
    "run `npm run db:snapshot` after a sync and commit it",
  );
});

test("merged venues: the removed slug is gone, the kept one exists", () => {
  for (const [keep, drop] of MERGED_VENUES) {
    assert.ok(slugs.has(keep), `kept venue ${keep} missing`);
    assert.ok(!slugs.has(drop), `merged venue ${drop} still listed`);
  }
});

test("website-checked dates belong to venues with a website", () => {
  const bySlug = new Map(listings.map((l) => [l.slug, l]));
  for (const [slug, date] of Object.entries(WEBSITE_CHECKED)) {
    assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `${slug}: date ${date}`);
    // A venue archived since the check may linger until the file is regenerated.
    const l = bySlug.get(slug);
    if (l) assert.ok(l.websiteUrl, `${slug} has a checked date but no website`);
  }
});

test("every Wikimedia cover photo has a credit", () => {
  const uncredited = listings
    .filter((l) => l.coverImageUrl?.includes("upload.wikimedia.org"))
    .filter((l) => PHOTO_CREDITS[l.slug]?.imageUrl !== l.coverImageUrl)
    .map((l) => l.slug);
  assert.deepEqual(uncredited, [], "run `npm run import:sync-credits`");
});

test("cover photos only come from licensed sources", () => {
  const other = listings.filter((l) => l.coverImageUrl && !l.coverImageUrl.startsWith("https://upload.wikimedia.org/")).map((l) => l.slug);
  assert.deepEqual(other, [], "only Wikimedia Commons photos are licensed (see PLAN.md)");
});

test("calendar events link to existing venues and have valid dates", () => {
  for (const e of CALENDAR_EVENTS) {
    assert.match(e.startDate, /^\d{4}-\d{2}-\d{2}$/, `${e.name}: startDate`);
    if (e.endDate) assert.ok(e.endDate >= e.startDate, `${e.name}: ends before it starts`);
    if (e.listingSlug) assert.ok(slugs.has(e.listingSlug), `${e.name}: unknown listingSlug ${e.listingSlug}`);
  }
});

test("track outlines belong to published venues and are valid drawings", () => {
  const outlines: Record<string, { d: string; w: number; h: number; lengthM: number }> = JSON.parse(
    readFileSync("data/track-outlines.json", "utf-8"),
  );
  for (const [slug, o] of Object.entries(outlines)) {
    assert.ok(slugs.has(slug), `outline for unknown venue ${slug}; rerun build-track-outlines.ts`);
    assert.match(o.d, /^M\d/, `${slug}: path`);
    assert.ok(o.w > 0 && o.h > 0 && Math.max(o.w, o.h) <= 1000, `${slug}: size ${o.w}x${o.h}`);
    assert.ok(o.lengthM > 0, `${slug}: length`);
  }
});
