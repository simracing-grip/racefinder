import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListings, getCountries } from "@/lib/listings";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";
import FilterBar from "@/components/Filters/FilterBar";
import ListingGrid from "@/components/Listing/ListingGrid";
import MapView from "@/components/Map/MapView";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.value }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORIES.find((c) => c.value === category);
  if (!meta) return {};
  return {
    title: meta.plural,
    description: `Browse ${meta.plural.toLowerCase()}${meta.global ? " worldwide" : " across Europe"}.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORIES.find((c) => c.value === category);
  if (!meta) notFound();

  const { country } = await searchParams;
  const [listings, countries] = await Promise.all([
    getListings({ category: category as Category, country }),
    getCountries(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">{meta.plural}</h1>
      <p className="mb-6 text-gray-500">
        {listings.length} location{listings.length === 1 ? "" : "s"}
        {meta.global ? " worldwide" : " across Europe"}
      </p>

      <section className="mb-6">
        <MapView listings={listings} height="320px" />
      </section>

      <section className="mb-6">
        <FilterBar countries={countries} activeCategory={category as Category} />
      </section>

      <ListingGrid listings={listings} />
    </div>
  );
}
