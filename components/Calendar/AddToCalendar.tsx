"use client";

import { useEffect, useRef, useState } from "react";
import { eventId, googleCalendarUrl, type IcsEvent } from "@/lib/ics";

function CalendarPlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5" />
    </svg>
  );
}

// "Add to calendar" for one race weekend: Google gets a pre-filled event
// link; Apple Calendar, Outlook and the rest get an .ics download.
export default function AddToCalendar({
  event,
  siteUrl,
  compact = false,
}: {
  event: IcsEvent;
  siteUrl: string;
  /** Icon-only trigger, for dense rows. */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5 hover:text-white";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={compact ? `Add ${event.name} to your calendar` : undefined}
        title={compact ? "Add to calendar" : undefined}
        className={
          compact
            ? "flex h-9 w-9 items-center justify-center border border-white/10 text-gray-400 transition hover:border-white/40 hover:text-white"
            : "inline-flex items-center gap-2 border border-white/20 px-4 py-2 font-display text-base font-bold uppercase italic text-white transition hover:border-white"
        }
      >
        <CalendarPlusIcon />
        {!compact && "Add to calendar"}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-56 border border-white/10 bg-panel py-1 shadow-2xl shadow-black/60">
          <a
            role="menuitem"
            href={googleCalendarUrl(event, siteUrl)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={item}
          >
            Google Calendar <span className="ml-auto text-gray-500" aria-hidden>&#8599;</span>
          </a>
          <a role="menuitem" href={`/calendar/event/${eventId(event)}.ics`} download onClick={() => setOpen(false)} className={item}>
            Apple / Outlook (.ics) <span className="ml-auto text-gray-500" aria-hidden>&darr;</span>
          </a>
        </div>
      )}
    </div>
  );
}
