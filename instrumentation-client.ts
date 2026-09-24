import * as Sentry from "@sentry/nextjs";

// No-ops when NEXT_PUBLIC_SENTRY_DSN is unset, so this is safe to ship
// before a Sentry project exists — see .env.example. Must be
// NEXT_PUBLIC_-prefixed since it's read in the browser bundle.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
