"use client";

import { useState } from "react";
import type { EventSeries } from "@/lib/types";
import { SERIES_FULL_NAME } from "@/lib/seriesMeta";
import { subscribeLinks } from "@/lib/ics";

// "Subscribe in your calendar app" for a series feed (or all series). A
// subscription stays in sync as rounds are added or moved, unlike a one-off
// download.
export default function SubscribePanel({ series, siteUrl }: { series: EventSeries | "all"; siteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const feedUrl = `${siteUrl}/calendar/feed/${series}.ics`;
  const links = subscribeLinks(feedUrl);
  const what = series === "all" ? "every race in this calendar" : `every ${SERIES_FULL_NAME[series]} round`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(links.https);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this calendar link:", links.https);
    }
  }

  const btn =
    "inline-flex items-center gap-2 border border-white/15 bg-asphalt px-3.5 py-2 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:text-white";

  return (
    <section className="relative overflow-hidden border border-white/10 bg-panel p-5 sm:p-6">
      <div className="speed-lines pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-timing">Never miss a race</p>
          <h2 className="mt-1 font-display text-2xl font-black uppercase italic text-white sm:text-3xl">
            Subscribe in your calendar
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Get {what} in your own calendar. It updates itself when dates change.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={links.google} target="_blank" rel="noopener noreferrer" className={btn}>
            Google Calendar
          </a>
          <a href={links.webcal} className={btn}>
            Apple / Outlook
          </a>
          <button type="button" onClick={copy} className={btn}>
            {copied ? "Link copied ✓" : "Copy link"}
          </button>
        </div>
      </div>
    </section>
  );
}
