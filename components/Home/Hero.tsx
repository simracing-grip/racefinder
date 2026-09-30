import Link from "next/link";
import type { Listing } from "@/lib/types";
import HeroTrack from "./HeroTrack";
import HeroSearch from "./HeroSearch";
import CountryPicker from "./CountryPicker";

export default function Hero({
  listings,
  countries,
  countryCodes,
  raceCount,
}: {
  listings: Listing[];
  countries: string[];
  countryCodes: Record<string, string>;
  raceCount: number;
}) {
  const stats = [
    { value: listings.length.toLocaleString("en-GB"), label: "Venues" },
    { value: `${countries.length}`, label: "Countries" },
    { value: `${raceCount}`, label: "Races ahead" },
  ];

  return (
    // z-20 (not overflow-hidden) so the search dropdown can hang over the ticker below.
    <section className="relative isolate z-20">
      {/* backdrop: grid, red glow, speed streaks — clipped here instead */}
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-signal/15 blur-[120px]" />
        <div className="speed-lines absolute inset-0" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-12 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
        <div className="relative z-10">
          <p className="inline-flex animate-rise items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
            <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal" aria-hidden />
            Sim &middot; Track days &middot; Karting &middot; F1
          </p>

          <h1 className="mt-6 animate-rise font-display text-[4.25rem] font-black uppercase italic leading-[0.82] tracking-tight text-white [animation-delay:80ms] sm:text-8xl lg:text-[8.5rem]">
            Find your
            <br />
            <span className="relative inline-block text-signal">
              next lap.
              <span className="kerb absolute -bottom-2 left-1 h-2 w-[92%] -skew-x-12 sm:-bottom-3 sm:h-3" aria-hidden />
            </span>
          </h1>

          <p className="mt-8 max-w-lg animate-rise text-lg leading-relaxed text-gray-300 [animation-delay:160ms]">
            {listings.length.toLocaleString("en-GB")} places to drive, race and spectate &mdash; from your local kart
            track to Monza. Search it, map it, go drive it.
          </p>

          <div className="mt-8 animate-rise [animation-delay:240ms]">
            <HeroSearch listings={listings} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CountryPicker countries={countries} countryCodes={countryCodes} />
              <Link
                href="#explore"
                className="inline-flex items-center gap-1.5 border border-white/10 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:text-white"
              >
                Browse the map &darr;
              </Link>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-rise [animation-delay:200ms] sm:max-w-none">
          <HeroTrack className="w-full drop-shadow-[0_30px_60px_rgba(255,42,42,0.15)]" />

          {/* timing-tower readout over the circuit */}
          <dl className="absolute bottom-0 right-0 hidden w-56 border border-white/10 bg-ink/85 font-mono text-sm backdrop-blur sm:block">
            <div className="flex items-center justify-between border-b border-white/10 bg-signal px-3 py-1.5 font-display text-sm font-extrabold uppercase italic tracking-wide text-white">
              <span>RaceFinder</span>
              <span className="text-white/80">Live</span>
            </div>
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center justify-between border-b border-white/5 px-3 py-2 last:border-0">
                <dt className="flex items-center gap-3 text-gray-500">
                  <span className="text-gray-600">{i + 1}</span>
                  {s.label.toUpperCase()}
                </dt>
                <dd className="font-semibold tabular-nums text-timing">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* compact stats on phones, where the tower is hidden */}
        <dl className="grid grid-cols-3 divide-x divide-white/10 border border-white/10 sm:hidden">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse px-3 py-3 text-center">
              <dt className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{s.label}</dt>
              <dd className="font-mono text-xl font-semibold text-timing">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
