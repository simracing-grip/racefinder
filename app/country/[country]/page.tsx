import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getListings,
  getCountries,
  getCountryCode,
  getCountryCodeMap,
  slugifyCountry,
} from "@/lib/listings";
import FilterBar from "@/components/Filters/FilterBar";
import MapListPanel from "@/components/Listing/MapListPanel";
import CityLinks from "@/components/Listing/CityLinks";
import { getCityHubs } from "@/lib/cities";
import PageHeader from "@/components/UI/PageHeader";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import { sortByUpcomingEvent } from "@/lib/listingSort";
import { toSummaries } from "@/lib/listingSummary";
import CountryFlag from "@/components/CountryFlag";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const countries = await getCountries();
  return countries.map((country) => ({ country: slugifyCountry(country) }));
}

async function resolveCountry(slug: string) {
  const countries = await getCountries();
  return countries.find((c) => slugifyCountry(c) === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const resolved = await resolveCountry(country);
  if (!resolved) return {};
  return pageMetadata({
    title: `Motorsport venues in ${resolved}`,
    description: `Karting tracks, track day circuits and sim racing centers in ${resolved}, on a map with upcoming race weekends.`,
    path: `/country/${slugifyCountry(resolved)}`,
    image: `/country/${slugifyCountry(resolved)}/opengraph-image`,
  });
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await params;
  const routeCountry = await resolveCountry(country);
  if (!routeCountry) notFound();

  // A query-string ?country= (set by FilterBar's dropdown) overrides the
  // route param, so the same dropdown works consistently on every page.
  const { country: queryCountry } = await searchParams;
  const resolved = queryCountry ?? routeCountry;

  const [listings, countries, countryCode, countryCodes] = await Promise.all([
    getListings({ country: resolved }),
    getCountries(),
    getCountryCode(resolved),
    getCountryCodeMap(),
  ]);
  // map + list share one slim array; venues with a race coming up first
  const summaries = sortByUpcomingEvent(toSummaries(listings));
  const cities = (await getCityHubs()).filter((h) => h.country === resolved);
  const byCategory = CATEGORIES.map((c) => ({ ...c, count: listings.filter((l) => l.categories.includes(c.value)).length })).filter(
    (c) => c.count > 0
  );

  return (
    <div>
      <PageHeader
        kicker="Country"
        title={resolved}
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/map", label: "World map" },
          { href: `/country/${slugifyCountry(resolved)}`, label: resolved },
        ]}
        aside={countryCode && <CountryFlag countryCode={countryCode} className="text-7xl shadow-2xl shadow-black/50" />}
      >
        <p>
          <span className="font-mono text-white">{listings.length.toLocaleString("en-GB")}</span> places to race in{" "}
          {resolved}.
        </p>
        {byCategory.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {byCategory.map((c) => (
              <li
                key={c.value}
                className="border border-white/10 bg-asphalt px-3 py-1.5 font-display text-sm font-bold uppercase italic"
                style={{ color: CATEGORY_COLOR[c.value] }}
              >
                {c.label} <span className="font-mono text-xs not-italic text-gray-400">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-3 px-4 pt-6">
        <FilterBar countries={countries} countryCodes={countryCodes} />
        <MapListPanel
          listings={summaries}
          title={`Venues in ${resolved}`}
          summary={`location${summaries.length === 1 ? "" : "s"} — race weekends first. Tap one to find it on the map.`}
        />

        {cities.length > 0 && (
          <section className="pt-10">
            <h2 className="mb-4 font-display text-3xl font-black uppercase italic text-white">
              Places to race by city
            </h2>
            <CityLinks hubs={cities} />
          </section>
        )}
      </div>
    </div>
  );
}
