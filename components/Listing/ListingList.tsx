import type { Listing } from "@/lib/types";
import ListingRow from "./ListingRow";

export default function ListingList({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
        No locations match these filters yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {listings.map((listing) => (
        <ListingRow key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
