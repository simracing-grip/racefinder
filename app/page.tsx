import { getListings, getCountries, sortByUpcomingEvent } from "@/lib/listings";
import FilterBar from "@/components/Filters/FilterBar";
import ListingList from "@/components/Listing/ListingList";
import CategoryPreview from "@/components/Listing/CategoryPreview";
import MapView from "@/components/Map/MapView";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const [listings, countries] = await Promise.all([
    getListings({ country: params.country }),
    getCountries(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Find your next lap, across Europe
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-400">
          A free, growing directory of sim racing centers, track day circuits, and
          karting tracks.
        </p>
      </section>

      <section className="mb-10 mx-auto max-w-3xl">
        <CategoryPreview listings={listings} />
      </section>

      <section className="mb-8">
        <MapView listings={listings} height="360px" />
      </section>

      <section className="mb-6">
        <FilterBar countries={countries} />
      </section>

      <section className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm text-gray-400">
          {listings.length} location{listings.length === 1 ? "" : "s"} &mdash; soonest upcoming
          events first, click one to expand
        </p>
        <ListingList listings={sortByUpcomingEvent(listings)} initialCount={10} />
      </section>
    </div>
  );
}
