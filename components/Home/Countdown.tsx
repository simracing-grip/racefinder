"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return [
    { label: "Days", value: Math.floor(s / 86400) },
    { label: "Hrs", value: Math.floor((s % 86400) / 3600) },
    { label: "Min", value: Math.floor((s % 3600) / 60) },
    { label: "Sec", value: s % 60 },
  ];
}

// Counts down to the start of a race weekend (calendar dates carry no session
// times, so the target is 00:00 UTC on the first day). Renders placeholders
// until mounted so server and client HTML match.
export default function Countdown({ startDate, endDate }: { startDate: string; endDate?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // Mount-only clock: server HTML has no "now", so it renders placeholders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate ?? startDate}T23:59:59Z`);

  if (now != null && now >= start && now <= end) {
    return (
      <div className="inline-flex items-center gap-3 bg-signal px-4 py-2 font-display text-2xl font-extrabold italic uppercase text-white">
        <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-white" aria-hidden />
        Race weekend live now
      </div>
    );
  }

  return (
    <div className="flex max-w-sm gap-2" role="timer" aria-live="off">
      {parts(now == null ? 0 : start - now).map((p) => (
        <div key={p.label} className="min-w-0 flex-1 border border-white/10 bg-ink/70 px-2 py-2 text-center">
          <p className="font-mono text-3xl font-semibold tabular-nums text-timing sm:text-4xl">
            {now == null ? "--" : String(p.value).padStart(2, "0")}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">{p.label}</p>
        </div>
      ))}
    </div>
  );
}
