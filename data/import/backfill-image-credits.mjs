/**
 * Fills author/license/sourcePageUrl in data/import/cover-images.csv for every
 * Wikimedia Commons image, using the Commons API's own attribution metadata.
 * Rows from other sources are left for a human/agent to complete.
 *
 * Run: node data/import/backfill-image-credits.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const FILE = path.join(process.cwd(), "data", "import", "cover-images.csv");
const COLUMNS = ["slug", "coverImageUrl", "source", "sourcePageUrl", "author", "license", "licenseUrl"];
const UA = "motorsport-directory-image-credits/0.1 (personal project; blazevic35@gmail.com)";

const stripHtml = (s) =>
  (s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function commonsFileName(url) {
  const u = new URL(url);
  if (u.hostname !== "upload.wikimedia.org") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const i = parts.indexOf("commons");
  if (i < 0) return null;
  const rest = parts.slice(i + 1);
  // /commons/thumb/a/ab/Name.jpg/800px-Name.jpg  vs  /commons/a/ab/Name.jpg
  const name = rest[0] === "thumb" ? rest[3] : rest[2];
  return name ? decodeURIComponent(name).replace(/_/g, " ") : null;
}

async function lookup(fileName) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo" +
    "&iiprop=extmetadata|url&titles=" +
    encodeURIComponent("File:" + fileName);
  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const page = Object.values(data.query.pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const m = info.extmetadata ?? {};
  return {
    sourcePageUrl: info.descriptionurl,
    author: stripHtml(m.Artist?.value) || stripHtml(m.Credit?.value),
    license: stripHtml(m.LicenseShortName?.value),
    licenseUrl: stripHtml(m.LicenseUrl?.value),
  };
}

const rows = parse(readFileSync(FILE, "utf-8"), { columns: true, skip_empty_lines: true });
let filled = 0;
let failed = 0;

for (const row of rows) {
  if (row.author && row.license) continue;
  const fileName = commonsFileName(row.coverImageUrl);
  if (!fileName) continue;
  try {
    const credit = await lookup(fileName);
    if (credit) {
      Object.assign(row, credit);
      filled++;
    } else {
      failed++;
      console.warn(`No Commons metadata for ${row.slug} (${fileName})`);
    }
  } catch (err) {
    failed++;
    console.warn(`Lookup failed for ${row.slug}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

writeFileSync(FILE, stringify(rows, { header: true, columns: COLUMNS }));
console.log(`Filled credits for ${filled} Commons rows (${failed} failed). Total rows: ${rows.length}.`);
