// Falls back to localhost so metadata/sitemap/robots all work in dev before
// a real domain is set — set NEXT_PUBLIC_SITE_URL once one is registered.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SITE_NAME = "RaceFinder";
export const SITE_DESCRIPTION =
  "Find sim racing centers, track day circuits, and karting tracks across Europe.";
export const CONTACT_EMAIL = "simracingbl@gmail.com";
