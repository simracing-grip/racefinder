"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:py-32">
      <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-timing">Red flag</p>
      <div className="kerb mt-3 h-2 w-40 -skew-x-12" aria-hidden />
      <h1 className="mt-6 font-display text-4xl font-black uppercase italic text-white sm:text-5xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-gray-400">That&apos;s on us, not you. Try again, or head back to the homepage.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="btn-skew bg-signal px-6 py-3 font-display text-lg font-black uppercase italic text-white transition hover:bg-white hover:text-ink"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-white/20 px-5 py-3 font-display text-lg font-bold uppercase italic text-white transition hover:border-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
