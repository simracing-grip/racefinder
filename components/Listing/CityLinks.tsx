import Link from "next/link";
import type { CityHub } from "@/lib/cities";

// Grid of links to "Places to race near {city}" pages — on city pages
// (other cities) and country pages (that country's cities).
export default function CityLinks({ hubs }: { hubs: CityHub[] }) {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-4">
      {hubs.map((h) => (
        <li key={`${h.countrySlug}/${h.slug}`}>
          <Link
            href={`/country/${h.countrySlug}/${h.slug}`}
            className="group flex h-full items-baseline justify-between gap-3 bg-asphalt px-4 py-3 transition hover:bg-panel"
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold text-white group-hover:text-signal">Near {h.name}</span>
              <span className="block truncate text-xs text-gray-500">{h.country}</span>
            </span>
            <span className="shrink-0 font-mono text-xs text-gray-400">{h.venueCount}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
