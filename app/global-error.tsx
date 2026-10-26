"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import ServerErrorScreen from "@/components/Brand/ServerErrorScreen";

// Only catches errors thrown by the root layout itself (rare) — errors
// anywhere inside it are caught by app/error.tsx instead. Next.js requires
// this file to render its own <html>/<body> since the real root layout
// failed, so it shares pages/500.tsx's self-styled screen.
export default function GlobalError({ error }: { error: unknown }) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#07080b" }}>
        <title>Something went wrong | RaceFinder</title>
        <ServerErrorScreen />
      </body>
    </html>
  );
}
