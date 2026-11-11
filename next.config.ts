import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { MERGED_VENUES } from "./data/merged-venues";

const nextConfig: NextConfig = {
  // lib/listings.ts reads this at runtime (fs, not import) as its fallback
  // when the database is unreachable, so file tracing can't see it — ship
  // it with every server route explicitly.
  outputFileTracingIncludes: {
    "/**": ["./data/listings-snapshot.json"],
  },
  // Basic security headers on every response (Vercel adds HSTS itself).
  // No full Content-Security-Policy yet: venue photos come from many hosts,
  // and the map, Sentry and analytics would all need listing first.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nobody can show the site inside a frame on their own page.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
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
