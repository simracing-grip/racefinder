import { getListings } from "@/lib/listings";
import MapView from "@/components/Map/MapView";
import { toSummaries } from "@/lib/listingSummary";

// Served as a cached page, rebuilt at most every 5 minutes (ISR), so
// visitors never wait on the database. Must be a literal number.
export const revalidate = 300;

export const metadata = { title: "Map" };

export default async function MapPage() {
  const listings = await getListings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">All locations</h1>
      <MapView listings={toSummaries(listings)} height="75vh" />
    </div>
  );
}
