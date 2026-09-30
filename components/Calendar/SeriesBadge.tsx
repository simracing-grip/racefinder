import type { EventSeries } from "@/lib/types";
import { SERIES_LABEL, SERIES_BADGE_CLASS } from "@/lib/seriesMeta";

export default function SeriesBadge({ series, className = "" }: { series: EventSeries; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 px-2 py-0.5 font-display text-xs font-extrabold uppercase italic tracking-wide ${SERIES_BADGE_CLASS[series]} ${className}`}
    >
      {SERIES_LABEL[series]}
    </span>
  );
}
