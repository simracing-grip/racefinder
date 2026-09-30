"use client";

import { useGarage, type SaveableVenue } from "@/lib/garage";

export function StarIcon({ filled, className = "h-4 w-4" }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Save / unsave a venue to "My garage". `compact` is the icon-only version
// for list rows.
export default function SaveButton({ venue, compact = false }: { venue: SaveableVenue; compact?: boolean }) {
  const { has, toggle } = useGarage();
  const saved = has(venue.slug);
  const label = saved ? `Remove ${venue.name} from your garage` : `Save ${venue.name} to your garage`;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => toggle(venue)}
        aria-pressed={saved}
        aria-label={label}
        title={saved ? "Saved to your garage" : "Save to your garage"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center transition hover:bg-white/5 ${
          saved ? "text-timing" : "text-gray-500 hover:text-white"
        }`}
      >
        <StarIcon filled={saved} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(venue)}
      aria-pressed={saved}
      aria-label={label}
      className={`inline-flex items-center gap-2 border px-5 py-3 font-display text-lg font-bold uppercase italic transition ${
        saved ? "border-timing/60 text-timing hover:border-timing" : "border-white/20 text-white hover:border-white"
      }`}
    >
      <StarIcon filled={saved} className="h-5 w-5" />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
