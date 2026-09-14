import Link from "next/link";
import type { Listing } from "@/lib/types";
import CategoryBadge from "./CategoryBadge";

export default function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
    >
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
        {listing.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.coverImageUrl}
            alt={listing.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm">No photo yet</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5">
          {listing.categories.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
          {listing.featured && (
            <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Featured
            </span>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 group-hover:underline">
          {listing.name}
        </h3>
        <p className="text-sm text-gray-500">
          {listing.city}, {listing.country}
        </p>
        {listing.description && (
          <p className="line-clamp-2 text-sm text-gray-600">{listing.description}</p>
        )}
      </div>
    </Link>
  );
}
