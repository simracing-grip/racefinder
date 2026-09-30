// The public origin used for canonical/OG URLs, the sitemap and robots.txt:
//  1. NEXT_PUBLIC_SITE_URL — set this on Vercel once a custom domain exists.
//  2. Vercel's production domain (a system env var present on every Vercel
//     build, previews included), so a deploy can never advertise localhost —
//     which is what the live sitemap and share previews did while (1) was unset.
//  3. localhost, for local dev.
const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (vercelProduction ? `https://${vercelProduction}` : "http://localhost:3000")
).replace(/\/$/, "");
export const SITE_NAME = "RaceFinder";
export const SITE_TAGLINE = `${SITE_NAME} — Sim Racing, Track Days, Karting & F1`;
export const SITE_DESCRIPTION =
  "Find karting tracks, track day circuits, sim racing centers and every F1 circuit worldwide — on one map, with a race calendar for F1, MotoGP, WEC and more.";
export const CONTACT_EMAIL = "simracingbl@gmail.com";
