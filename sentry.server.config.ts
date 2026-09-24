import * as Sentry from "@sentry/nextjs";

// No-ops when SENTRY_DSN is unset, so this is safe to ship before a Sentry
// project exists — see .env.example.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
