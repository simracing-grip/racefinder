import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListingBySlug } from "@/lib/listings";
import CategoryBadge from "@/components/Listing/CategoryBadge";
import ListingDetails from "@/components/Listing/ListingDetails";
import MapView from "@/components/Map/MapView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};
  return {
    title: listing.name,
    description:
      listing.description ?? `${listing.name} — ${listing.city}, ${listing.country}`,
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: listing.name,
    description: listing.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressCountry: listing.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.lat,
      longitude: listing.lng,
    },
    url: listing.websiteUrl,
    telephone: listing.phone,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        {listing.categories.map((c) => (
          <CategoryBadge key={c} category={c} />
        ))}
        {listing.featured && (
          <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Featured
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold">{listing.name}</h1>
      <p className="mt-1 text-gray-500">
        {listing.address || `${listing.city}, ${listing.country}`}
      </p>

      {listing.description && (
        <p className="mt-4 max-w-2xl text-gray-700">{listing.description}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_1fr]">
        <MapView listings={[listing]} height="360px" />

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Details</h2>
          <ListingDetails listing={listing} />

          <div className="mt-5 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
            Run this venue?{" "}
            <span className="font-medium text-gray-700">
              Claiming listings isn&apos;t open yet — check back soon.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
