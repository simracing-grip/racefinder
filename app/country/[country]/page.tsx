import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListings, getCountries } from "@/lib/listings";
import FilterBar from "@/components/Filters/FilterBar";
import ListingList from "@/components/Listing/ListingList";
import MapView from "@/components/Map/MapView";

export async function generateStaticParams() {
  const countries = await getCountries();
  return countries.map((country) => ({ country: slugifyCountry(country) }));
}

function slugifyCountry(country: string) {
  return country.toLowerCase().replace(/\s+/g, "-");
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
  return {
    title: `Motorsport venues in ${resolved}`,
    description: `Sim racing, track day, and karting locations in ${resolved}.`,
  };
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

  const [listings, countries] = await Promise.all([
    getListings({ country: resolved }),
    getCountries(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Motorsport venues in {resolved}</h1>
      <p className="mb-6 text-gray-500">
        {listings.length} location{listings.length === 1 ? "" : "s"}
      </p>

      <section className="mb-6">
        <MapView listings={listings} height="320px" />
      </section>

      <section className="mb-6">
        <FilterBar countries={countries} />
      </section>

      <section className="mx-auto max-w-3xl">
        <ListingList listings={listings} />
      </section>
    </div>
  );
}
