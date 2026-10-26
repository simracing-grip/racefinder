/**
 * Writes data/listings-snapshot.json: every published listing in Postgres,
 * in the same Listing shape and name order lib/listings.ts builds from the
 * live query. The site serves this file only when the database is
 * unreachable and a server instance has nothing cached (see
 * loadSnapshotListings in lib/listings.ts), e.g. while Supabase has paused
 * the project. Calendar events and photo credits are not baked in; they're
 * merged at load time from data/calendar-events.ts / data/photo-credits.ts.
 *
 * Re-run after anything that changes published venues (npm run import:load,
 * the sync-* scripts, archiving), then commit the JSON, or an outage will
 * serve the directory as of the previous export.
 *
 * Run: npm run db:snapshot   (needs DATABASE_URL in .env)
 */
import "dotenv/config";
import { renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { asc, eq } from "drizzle-orm";

const OUT_FILE = path.join(process.cwd(), "data", "listings-snapshot.json");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set.");
    process.exitCode = 1;
    return;
  }

  const { db } = await import("../../lib/db/client");
  const { listings: listingsTable } = await import("../../lib/db/schema");
  const { rowToListing } = await import("../../lib/db/rowToListing");

  const rows = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.status, "published"))
    .orderBy(asc(listingsTable.name));
  if (rows.length === 0) {
    // Never replace a good snapshot with an empty one.
    console.log("No published listings returned; snapshot left unchanged.");
    process.exitCode = 1;
    return;
  }

  // Temp file + rename, so a failed write can't leave a truncated snapshot.
  const tmp = `${OUT_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(rows.map(rowToListing), null, 2) + "\n");
  renameSync(tmp, OUT_FILE);
  console.log(`Wrote ${rows.length} published listings to ${path.relative(process.cwd(), OUT_FILE)}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  // postgres-js keeps the connection pool open; nothing else to wait for.
  .finally(() => process.exit());
