"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-red-500">Error</p>
      <h1 className="mt-2 text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-gray-400">
        That&apos;s on us, not you. Try again, or head back to the homepage.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-200 hover:border-gray-500"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
