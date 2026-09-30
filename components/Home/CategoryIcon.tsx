import type { Category } from "@/lib/types";

// Minimal line icons, one per category plus "all" — kept abstract/geometric
// (not literal illustrations) so they read cleanly at small sizes and stay
// visually consistent with each other.
export default function CategoryIcon({
  category,
  className = "h-5 w-5",
}: {
  category: Category | "all";
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (category) {
    case "all":
      // Checkered flag
      return (
        <svg {...common}>
          <path d="M5 3v18" />
          <path d="M5 4h6l1.5 1.5L14 4h5v8h-5l-1.5-1.5L11 12H5z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );
    case "sim_racing":
      // Steering wheel
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="M12 6.2V9.8M6.4 15l3.4-2M17.6 15l-3.4-2" />
        </svg>
      );
    case "track_day":
      // Circuit loop
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="13" rx="6.5" />
          <path d="M8 9.2h3.2a1.4 1.4 0 0 1 0 2.8H12.8a1.4 1.4 0 0 0 0 2.8H16" />
        </svg>
      );
    case "karting":
      // Go-kart, side view
      return (
        <svg {...common}>
          <path d="M3.5 16.5h1.2l1.6-4.2a2 2 0 0 1 1.9-1.3h7.6a2 2 0 0 1 1.9 1.3l1.6 4.2h1.2" />
          <path d="M8 11l1-3h6l1 3" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "f1":
      // Open-wheel car, side view
      return (
        <svg {...common}>
          <path d="M3 15.5h2.2l2-3.3c.5-.9 1.5-1.4 2.5-1.4h6c1.4 0 2.7.7 3.4 1.9l1.4 2.3.5 1.4" />
          <path d="M9 10.8V9.2h5" />
          <circle cx="6.5" cy="16.5" r="1.8" />
          <circle cx="17.5" cy="16.5" r="1.8" />
        </svg>
      );
    case "club_only":
      // Padlock
      return (
        <svg {...common}>
          <rect x="5.5" y="11" width="13" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <circle cx="12" cy="15.2" r="1.3" fill="currentColor" />
        </svg>
      );
  }
}
