import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { MERGED_VENUES } from "./data/merged-venues";

// Pages are statically rendered, so Next.js can't add per-request nonces;
// its inline bootstrap scripts need 'unsafe-inline'. The policy still pins
// where scripts, data, workers and forms may come from or go to.
//  - map: style, tiles, glyphs and sprites from OpenFreeMap; MapLibre's
//    worker is served from /maplibre-gl-worker.mjs (blob: for older builds)
//  - Sentry: the browser SDK posts to the DSN's *.ingest[.de].sentry.io host
//  - Vercel Analytics: same origin (/_vercel/insights)
//  - images: venue photos are plain <img> from Wikimedia and future licensed
//    hosts, so any https image is allowed
const isDev = process.env.NODE_ENV !== "production";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://tiles.openfreemap.org https://*.sentry.io${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  // lib/listings.ts reads this at runtime (fs, not import) as its fallback
  // when the database is unreachable, so file tracing can't see it — ship
  // it with every server route explicitly.
  outputFileTracingIncludes: {
    "/**": ["./data/listings-snapshot.json"],
  },
  // Security headers on every response (Vercel adds HSTS itself).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nobody can show the site inside a frame on their own page.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
          // Location is used by "Near me" on the home page; nothing else is.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), payment=(), usb=(), interest-cohort=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
  // Duplicate venues merged into one: send the removed page to the kept one.
  async redirects() {
    return MERGED_VENUES.map(([keep, drop]) => ({
      source: `/listings/${drop}`,
      destination: `/listings/${keep}`,
      permanent: true,
    }));
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // No-ops (skips the source-map upload step) when SENTRY_AUTH_TOKEN is
  // unset, so this is safe to ship before a Sentry project exists — see
  // .env.example. Error reporting itself doesn't need this token.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
