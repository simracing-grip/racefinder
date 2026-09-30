// The imported venues live in generated-listings.json (written by
// data/import/import-to-db.ts — don't edit by hand; re-run
// `npm run import:load` after updating data/import/review.csv).
//
// Read at runtime rather than inlined as a TS array literal: at ~3,500 venues
// a literal typed as Listing[] makes TypeScript fail with TS2590 ("union type
// too complex to represent"), which breaks `next build`. Only the import
// scripts use this (the site reads Postgres), and they run from the repo root.
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Listing } from "@/lib/types";

export const generatedListings: Listing[] = JSON.parse(
  readFileSync(path.join(process.cwd(), "data", "generated-listings.json"), "utf-8")
);
