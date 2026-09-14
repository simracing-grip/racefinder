import { getListings } from "@/lib/listings";
import MapView from "@/components/Map/MapView";

export const metadata = { title: "Map" };

export default async function MapPage() {
  const listings = await getListings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">All locations</h1>
      <MapView listings={listings} height="75vh" />
    </div>
  );
}
