import Link from "next/link";
import type { Listing } from "@/lib/types";
import { slugifyCountry } from "@/lib/countrySlug";
import CountryFlag from "@/components/CountryFlag";
import SectionHeading from "./SectionHeading";

const SHOWN = 12;

// Top countries by venue count, as a flag grid into each /country page.
export default function CountryGrid({ listings, totalCountries }: { listings: Listing[]; totalCountries: number }) {
  const byCountry = new Map<string, { country: string; code: string; count: number }>();
  for (const l of listings) {
    const entry = byCountry.get(l.country) ?? { country: l.country, code: l.countryCode, count: 0 };
    entry.count++;
    byCountry.set(l.country, entry);
  }
  const top = [...byCountry.values()].sort((a, b) => b.count - a.count).slice(0, SHOWN);

  return (
    <section className="mx-auto max-w-7xl px-4">
      <SectionHeading kicker="Grid positions" title="Top racing countries" href="/map" hrefLabel={`All ${totalCountries} countries`} />
      <ol className="grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-4">
        {top.map((c, i) => (
          <li key={c.country}>
            <Link
              href={`/country/${slugifyCountry(c.country)}`}
              className="group flex h-full items-center gap-4 bg-asphalt px-4 py-4 transition hover:bg-panel"
            >
              <span className="w-7 font-mono text-sm text-gray-600 group-hover:text-signal">P{i + 1}</span>
              <CountryFlag countryCode={c.code} className="shrink-0 text-2xl" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">{c.country}</span>
                <span className="font-mono text-xs text-gray-500">{c.count.toLocaleString("en-GB")} venues</span>
              </span>
              <span className="text-gray-600 transition group-hover:translate-x-1 group-hover:text-white" aria-hidden>
                &rarr;
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
