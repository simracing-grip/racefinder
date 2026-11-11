/**
 * Removes every cover photo that isn't from Wikimedia Commons: photos copied
 * from venue websites, tourism sites, TripAdvisor and the like, which we have
 * no licence to show (standing rule 3 in PLAN.md).
 *
 *  - data/import/cover-images.csv keeps only Wikimedia Commons rows. The
 *    removed rows are appended to data/import/cover-images-unlicensed.csv,
 *    so a venue that later gives permission can be restored from there.
 *  - data/generated-listings.json: coverImageUrl removed for those venues.
 *  - Postgres: cover_image_url set to null for the same venues, only where it
 *    still holds the removed URL. Nothing else is touched.
 *
 * Afterwards run `npm run import:sync-credits` and `npm run db:snapshot`.
 * The venues show the "No photo yet" placeholder until a licensed photo is
 * found (apply-photo-run.ts) or the venue sends one.
 *
 * Run: npx tsx data/import/remove-unlicensed-photos.ts [--dry-run]
 */
import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { sql } from "drizzle-orm";
import type { Listing } from "../../lib/types";

const COVER_CSV = path.join(process.cwd(), "data", "import", "cover-images.csv");
const REMOVED_CSV = path.join(process.cwd(), "data", "import", "cover-images-unlicensed.csv");
const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const DRY_RUN = process.argv.includes("--dry-run");

const isLicensed = (url: string | undefined) => !!url && new URL(url).host === "upload.wikimedia.org";

async function main() {
  // 1. Venues on the site showing an unlicensed photo.
  const generated: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const toClear = generated.filter((l) => l.coverImageUrl && !isLicensed(l.coverImageUrl));
  console.log(`${toClear.length} published venues show a photo that isn't from Wikimedia Commons.`);

  // 2. cover-images.csv: keep Commons rows only.
  const content = readFileSync(COVER_CSV, "utf-8");
  const rows = parse(content, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const columns = Object.keys(rows[0] ?? {});
  const keep = rows.filter((r) => isLicensed(r.coverImageUrl));
  const removed = rows.filter((r) => !isLicensed(r.coverImageUrl));
  console.log(`cover-images.csv: ${rows.length} rows -> ${keep.length} (${removed.length} moved to ${path.basename(REMOVED_CSV)}).`);

  const clearedJson = generated.map((l) => {
    if (!l.coverImageUrl || isLicensed(l.coverImageUrl)) return l;
    const rest = { ...l };
    delete rest.coverImageUrl;
    return rest;
  });

  if (!DRY_RUN) {
    const header = !existsSync(REMOVED_CSV);
    appendFileSync(REMOVED_CSV, stringify(removed, { header, columns }));
    writeFileSync(COVER_CSV, stringify(keep, { header: true, columns }));
    writeFileSync(GENERATED_FILE, JSON.stringify(clearedJson, null, 2) + "\n");
  }

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipped the database.");
    return;
  }
  const { db } = await import("../../lib/db/client");
  if (!db) return;

  // Every unlicensed URL in the database, not only the ones in the JSON, in
  // case the two have drifted.
  const live = await db.execute<{ slug: string; cover_image_url: string }>(
    sql`select slug, cover_image_url from listings where cover_image_url is not null and cover_image_url not like 'https://upload.wikimedia.org/%'`
  );
  console.log(`Postgres: ${live.length} rows with a non-Commons cover photo (any status).`);
  if (DRY_RUN || live.length === 0) return;
  // Backup of exactly what is cleared, so it can be restored.
  const backup = path.join(process.cwd(), "data", "import", `cover-images-cleared-${new Date().toISOString().slice(0, 10)}.csv`);
  writeFileSync(backup, stringify(live.map((r) => ({ slug: r.slug, coverImageUrl: r.cover_image_url })), { header: true }));
  console.log(`Backup of the cleared rows: ${backup}`);

  const values = sql.join(
    live.map((r) => sql`(${r.slug}, ${r.cover_image_url})`),
    sql`, `
  );
  const result = await db.execute<{ slug: string }>(sql`
    update listings as l set cover_image_url = null, updated_at = now()
    from (values ${values}) as v(slug, url)
    where l.slug = v.slug and l.cover_image_url = v.url
    returning l.slug`);
  console.log(`Cleared ${result.length} cover photo(s) in Postgres.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
