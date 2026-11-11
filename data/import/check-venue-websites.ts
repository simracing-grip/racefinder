/**
 * Quick health check of every published venue's website, as a first pass
 * before a venue-verifier run: it flags the venues worth a closer look, it
 * doesn't decide anything.
 *
 * For each websiteUrl: fetch it (redirects followed, 20 s timeout) and record
 *  - dead: DNS failure, connection error, timeout or HTTP 4xx/5xx
 *  - parked: the page looks like a parked or for-sale domain
 *  - closed: the page says the venue has closed for good
 *  - moved: the final URL is on a different site than the one listed
 *  - ok: none of the above
 * Bot-blocking answers (HTTP 401/403/429, Cloudflare challenges) count as ok:
 * the site is up, it just doesn't talk to scripts.
 *
 * Writes data/import/website-check-<date>.csv and prints a summary.
 *
 * Run: npx tsx data/import/check-venue-websites.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stringify } from "csv-stringify/sync";
import type { Listing } from "../../lib/types";

const GENERATED_FILE = path.join(process.cwd(), "data", "generated-listings.json");
const OUT_FILE = path.join(process.cwd(), "data", "import", `website-check-${new Date().toISOString().slice(0, 10)}.csv`);
const CONCURRENCY = 8;
const TIMEOUT_MS = 20_000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const PARKED = [
  /domain (is|may be) for sale/i,
  /buy this domain/i,
  /this domain (has expired|is parked|is available)/i,
  /domain parking/i,
  /sedoparking|parkingcrew|bodis\.com|hugedomains|dan\.com\/buy|afternic/i,
  /the domain name .{0,40} is for sale/i,
  /domain .{0,30}expired/i,
];
const CLOSED = [
  /permanently closed/i,
  /closed permanently/i,
  /(we have|we've|has) (closed|ceased trading)/i,
  /ceased trading/i,
  /no longer (open|operating|trading)/i,
  /dauerhaft geschlossen/i,
  /endgültig geschlossen/i,
  /fermé définitivement|définitivement fermé/i,
  /cerrado permanentemente|cierre definitivo/i,
  /chiuso definitivamente|chiusura definitiva/i,
  /definitief gesloten/i,
];
// Social or link-hub "websites" redirect around a lot; a host change there
// means nothing.
const HOST_CHANGE_IGNORED = /facebook\.com|instagram\.com|linktr\.ee|google\.|wixsite\.com|business\.site/i;

function siteOf(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return host.split(".").slice(-2).join(".");
}

type Verdict = "ok" | "dead" | "parked" | "closed" | "moved";

async function check(l: Listing): Promise<{ verdict: Verdict; status: string; finalUrl: string; note: string }> {
  const url = l.websiteUrl!;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const finalUrl = res.url || url;
    const status = String(res.status);
    if ([401, 403, 429, 503].includes(res.status)) return { verdict: "ok", status, finalUrl, note: "blocks scripts" };
    if (res.status >= 400) return { verdict: "dead", status, finalUrl, note: `HTTP ${res.status}` };
    const html = (await res.text()).slice(0, 400_000);
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
    const parked = PARKED.find((re) => re.test(html));
    if (parked) return { verdict: "parked", status, finalUrl, note: String(parked) };
    const closed = CLOSED.find((re) => re.test(text));
    if (closed) {
      const m = text.match(closed);
      const at = m?.index ?? 0;
      return { verdict: "closed", status, finalUrl, note: text.slice(Math.max(0, at - 80), at + 80).replace(/\s+/g, " ").trim() };
    }
    if (siteOf(finalUrl) !== siteOf(url) && !HOST_CHANGE_IGNORED.test(url) && !HOST_CHANGE_IGNORED.test(finalUrl)) {
      return { verdict: "moved", status, finalUrl, note: `now ${new URL(finalUrl).hostname}` };
    }
    return { verdict: "ok", status, finalUrl, note: "" };
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause?.code ?? (err as Error).name;
    return { verdict: "dead", status: "", finalUrl: "", note: cause };
  }
}

async function main() {
  const listings: Listing[] = JSON.parse(readFileSync(GENERATED_FILE, "utf-8"));
  const todo = listings.filter((l) => l.websiteUrl);
  console.log(`Checking ${todo.length} websites…`);
  const rows: Record<string, string>[] = [];
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < todo.length) {
      const l = todo[next++];
      const r = await check(l);
      rows.push({ slug: l.slug, name: l.name, country: l.country, websiteUrl: l.websiteUrl!, ...r });
      if (++done % 50 === 0) process.stdout.write(`\r${done}/${todo.length}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  rows.sort((a, b) => a.verdict.localeCompare(b.verdict) || a.slug.localeCompare(b.slug));
  writeFileSync(OUT_FILE, stringify(rows, { header: true, columns: ["verdict", "slug", "name", "country", "websiteUrl", "status", "finalUrl", "note"] }));
  const count: Record<string, number> = {};
  for (const r of rows) count[r.verdict] = (count[r.verdict] ?? 0) + 1;
  console.log(`\n${JSON.stringify(count)} -> ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
