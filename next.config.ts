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
