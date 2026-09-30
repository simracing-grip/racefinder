import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListings, getCountries, getCountryCodeMap } from "@/lib/listings";
import { CATEGORIES } from "@/lib/types";
import type { Category } from "@/lib/types";
import FilterBar from "@/components/Filters/FilterBar";
import MapListPanel from "@/components/Listing/MapListPanel";
import PageHeader from "@/components/UI/PageHeader";
import CategoryIcon from "@/components/Home/CategoryIcon";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import { sortByUpcomingEvent } from "@/lib/listingSort";
import { toSummaries } from "@/lib/listingSummary";
import { pageMetadata } from "@/lib/seo";

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
  return pageMetadata({
    title: meta.plural,
    description: `Browse ${meta.plural.toLowerCase()} worldwide, on a map and list with upcoming race weekends.`,
    path: `/category/${meta.value}`,
    image: `/category/${meta.value}/opengraph-image`,
  });
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
  const [listings, countries, countryCodes] = await Promise.all([
    getListings({ category: category as Category, country }),
    getCountries(),
    getCountryCodeMap(),
  ]);
  // map + list share one slim array; venues with a race coming up first
  const summaries = sortByUpcomingEvent(toSummaries(listings));
  const accent = CATEGORY_COLOR[meta.value];
  const scope = country ? `in ${country}` : "worldwide";

  return (
    <div>
      <PageHeader
        kicker="Discipline"
        accent={accent}
        title={meta.plural}
        crumbs={[{ href: "/", label: "Home" }, { href: `/category/${meta.value}`, label: meta.plural }]}
        aside={
          <span className="flex h-20 w-20 items-center justify-center" style={{ background: `${accent}1f`, color: accent }}>
            <CategoryIcon category={meta.value} className="h-11 w-11" />
          </span>
        }
      >
        <span className="font-mono text-white">{listings.length.toLocaleString("en-GB")}</span> location
        {listings.length === 1 ? "" : "s"} {scope}.
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-3 px-4 pt-6">
        <FilterBar countries={countries} countryCodes={countryCodes} activeCategory={category as Category} />
        <MapListPanel
          listings={summaries}
          title={country ?? "All venues"}
          summary={`location${summaries.length === 1 ? "" : "s"} — race weekends first. Tap one to find it on the map.`}
        />
      </div>
    </div>
  );
}
