import Link from "next/link";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import CategoryIcon from "./CategoryIcon";
import SectionHeading from "./SectionHeading";

const PITCH: Partial<Record<Category, string>> = {
  sim_racing: "Pro rigs, motion platforms and leagues. Full send, zero bills.",
  track_day: "Take your own car to a real circuit — or hire one for the day.",
  karting: "Arrive-and-drive sessions, endurance races and kids' karts.",
  f1: "Every circuit on the current F1 calendar. Go watch it live.",
};

// Big, poster-style entry tiles into each /category page. Club/members-only
// is a modifier rather than a discipline, so it stays out of this grid.
export default function DisciplineGrid({ counts }: { counts: Record<Category, number> }) {
  // Biggest inventory first — lead with strength.
  const tiles = CATEGORIES.filter((c) => PITCH[c.value] && counts[c.value] > 0).sort(
    (a, b) => counts[b.value] - counts[a.value]
  );

  return (
    <section className="mx-auto max-w-7xl px-4">
      <SectionHeading kicker="Choose your weapon" title="Pick a discipline" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((c, i) => {
          const color = CATEGORY_COLOR[c.value];
          return (
            <Link
              key={c.value}
              href={`/category/${c.value}`}
              className="group relative flex min-h-72 flex-col overflow-hidden border border-white/10 bg-asphalt p-6 transition duration-300 hover:-translate-y-1 hover:border-white/25"
            >
              {/* accent wash + number watermark */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(120% 80% at 100% 0%, ${color}33, transparent 60%)` }}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute -bottom-6 -right-2 font-display text-[9rem] font-black italic leading-none text-white/[0.035]"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-25 transition duration-500 group-hover:scale-x-100" style={{ background: color }} aria-hidden />

              <span
                className="relative flex h-14 w-14 items-center justify-center"
                style={{ background: `${color}1f`, color }}
              >
                <CategoryIcon category={c.value} className="h-8 w-8" />
              </span>
              <p className="relative mt-auto pt-8 font-mono text-sm tabular-nums" style={{ color }}>
                {counts[c.value].toLocaleString("en-GB")} venues
              </p>
              <h3 className="relative mt-1 font-display text-4xl font-black uppercase italic leading-none text-white">
                {c.label}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-gray-400">{PITCH[c.value]}</p>
              <span className="relative mt-5 font-display text-base font-bold uppercase italic text-gray-300 transition group-hover:translate-x-1 group-hover:text-white">
                Explore <span aria-hidden>&rarr;</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
