import Link from "next/link";
import type { KartFilterKey, kartFilterCounts } from "@/lib/kartingFilters";

// Chip rows for the karting filters. Plain links (no client JS): each chip
// is the current URL with that one filter toggled, so filtered views are
// linkable and work before hydration.
export default function KartingFilters({
  basePath,
  params,
  groups,
  totalUnfiltered,
}: {
  basePath: string;
  /** Current query params (country + karting filters). */
  params: Record<string, string>;
  groups: ReturnType<typeof kartFilterCounts>;
  totalUnfiltered: number;
}) {
  const hrefWith = (key: KartFilterKey, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    const q = next.toString();
    return q ? `${basePath}?${q}` : basePath;
  };
  const anyActive = groups.some((g) => g.active);
  const clearHref = (() => {
    const next = new URLSearchParams(params);
    groups.forEach((g) => next.delete(g.key));
    const q = next.toString();
    return q ? `${basePath}?${q}` : basePath;
  })();

  return (
    <div className="border border-white/10 bg-asphalt p-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {groups.map((g) => (
          <div key={g.key} className="flex flex-wrap items-center gap-2" role="group" aria-label={g.label}>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{g.label}</span>
            {g.options.map((o) => {
              const active = g.active === o.value;
              return (
                <Link
                  key={o.value}
                  href={hrefWith(g.key, active ? null : o.value)}
                  aria-current={active ? "true" : undefined}
                  scroll={false}
                  className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "border-white bg-white text-ink"
                      : o.count === 0
                        ? "pointer-events-none border-white/5 text-gray-600"
                        : "border-white/10 bg-panel text-gray-300 hover:border-white/30"
                  }`}
                >
                  {o.label}
                  <span className={`font-mono text-xs ${active ? "text-ink/60" : "text-gray-500"}`}>{o.count}</span>
                </Link>
              );
            })}
          </div>
        ))}
        {anyActive && (
          <Link href={clearHref} scroll={false} className="ml-auto text-sm font-semibold text-gray-400 underline underline-offset-4 hover:text-white">
            Clear filters
          </Link>
        )}
      </div>
      <p className="mt-2.5 text-xs text-gray-500">
        {anyActive
          ? `Only tracks where this is confirmed are shown — ${totalUnfiltered.toLocaleString("en-GB")} tracks match without these filters, and details are still being added.`
          : "Details are confirmed for some tracks so far; filtering shows only confirmed ones."}
      </p>
    </div>
  );
}
