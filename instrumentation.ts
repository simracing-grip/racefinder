import * as Sentry from "@sentry/nextjs";

// Runs once at server boot, before any request is handled — the App
// Router's hook for one-time server-side setup. Only the nodejs runtime is
// initialized since this app has no Edge routes (no middleware.ts, no
// `export const runtime = "edge"`); add a sentry.edge.config.ts branch here
// if that changes.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
