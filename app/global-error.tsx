"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Only catches errors thrown by the root layout itself (rare) — errors
// anywhere inside it are caught by app/error.tsx instead. Next.js requires
// this file to render its own <html>/<body> since the real root layout
// failed.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500">Error</p>
          <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
          {/* A plain reload-based link, not next/link — the root layout that
              provides routing context is what just failed. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="mt-4 inline-block text-blue-400 hover:underline">
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
