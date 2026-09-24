import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
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
