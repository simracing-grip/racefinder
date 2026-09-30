import Link from "next/link";
import { getListings, getCountries } from "@/lib/listings";
import MapView from "@/components/Map/MapView";
import PageHeader from "@/components/UI/PageHeader";
import CategoryIcon from "@/components/Home/CategoryIcon";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR } from "@/lib/categoryMeta";
import { toSummaries } from "@/lib/listingSummary";
import { pageMetadata } from "@/lib/seo";

// Served as a cached page, rebuilt at most every 5 minutes (ISR), so
// visitors never wait on the database. Must be a literal number.
export const revalidate = 300;

export const metadata = pageMetadata({
  title: "World map",
  description: "Every karting track, track day circuit, sim racing center and F1 circuit in RaceFinder on one interactive map.",
  path: "/map",
});

export default async function MapPage() {
  const [listings, countries] = await Promise.all([getListings(), getCountries()]);

  return (
    <div>
      <PageHeader
        kicker="World map"
        title="Every venue, one map"
        crumbs={[
          { href: "/", label: "Home" },
          { href: "/map", label: "Map" },
        ]}
      >
        <span className="font-mono text-white">{listings.length.toLocaleString("en-GB")}</span> venues in{" "}
        <span className="font-mono text-white">{countries.length}</span> countries. Zoom in to split the clusters,
        or pick a discipline:
        <span className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/category/${c.value}`}
              className="inline-flex items-center gap-2 border border-white/10 bg-asphalt px-3 py-1.5 text-sm font-semibold text-gray-300 transition hover:border-white/30 hover:text-white"
            >
              <span style={{ color: CATEGORY_COLOR[c.value] }}>
                <CategoryIcon category={c.value} className="h-4 w-4" />
              </span>
              {c.label}
            </Link>
          ))}
        </span>
      </PageHeader>

      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="overflow-hidden border border-white/10">
          <MapView listings={toSummaries(listings)} height="75vh" />
        </div>
      </div>
    </div>
  );
}
