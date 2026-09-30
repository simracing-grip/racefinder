import type { CalendarEvent } from "@/lib/types";
import { SERIES_LABEL } from "@/lib/seriesMeta";
import { formatEventDate } from "@/lib/listingSort";

// Scrolling timing-screen strip of upcoming rounds across every series. The
// list is rendered twice so the -50% marquee loop is seamless.
export default function RaceTicker({ events }: { events: CalendarEvent[] }) {
  const items = events.slice(0, 16);
  if (items.length === 0) return null;

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((e) => (
        <li
          key={`${e.series}-${e.name}-${e.startDate}`}
          className="flex items-center gap-3 whitespace-nowrap border-r border-white/5 px-6 py-3"
        >
          <span className="font-display text-sm font-extrabold uppercase italic text-timing">{SERIES_LABEL[e.series]}</span>
          <span className="text-sm font-medium text-gray-200">{e.name}</span>
          <span className="font-mono text-xs text-gray-500">{formatEventDate(e.startDate)}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="group relative overflow-hidden border-y border-white/5 bg-asphalt">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center gap-2 bg-signal px-4 font-display text-sm font-black uppercase italic tracking-wide text-white [clip-path:polygon(0_0,100%_0,calc(100%-10px)_100%,0_100%)] pr-6">
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-white" aria-hidden />
        Up next
      </div>
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
