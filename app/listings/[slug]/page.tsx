import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListingBySlug } from "@/lib/listings";
import { CATEGORY_LABEL } from "@/lib/categoryMeta";
import CategoryBadge from "@/components/Listing/CategoryBadge";
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
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
          <DetailRow label="Website" value={listing.websiteUrl && (
            <a href={listing.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              Visit site
            </a>
          )} />
          <DetailRow label="Phone" value={listing.phone} />
          <DetailRow label="Indoor / Outdoor" value={listing.indoorOutdoor} />
          <DetailRow
            label="Track length"
            value={listing.trackLengthM ? `${listing.trackLengthM.toLocaleString()} m` : undefined}
          />

          {listing.details?.sim_racing && (
            <>
              <h3 className="mt-4 mb-1 text-xs font-semibold uppercase text-gray-400">
                {CATEGORY_LABEL.sim_racing}
              </h3>
              <DetailRow label="Simulators" value={listing.details.sim_racing.simulator_count} />
              <DetailRow
                label="Platforms"
                value={listing.details.sim_racing.simulator_platforms?.join(", ")}
              />
              <DetailRow label="Motion rig" value={listing.details.sim_racing.motion_rig ? "Yes" : undefined} />
              <DetailRow label="VR available" value={listing.details.sim_racing.vr_available ? "Yes" : undefined} />
            </>
          )}

          {listing.details?.track_day && (
            <>
              <h3 className="mt-4 mb-1 text-xs font-semibold uppercase text-gray-400">
                {CATEGORY_LABEL.track_day}
              </h3>
              <DetailRow
                label="Layouts"
                value={listing.details.track_day.track_config_variants?.join(", ")}
              />
              <DetailRow
                label="Car hire"
                value={listing.details.track_day.car_hire_available ? "Available" : undefined}
              />
              <DetailRow
                label="Passenger laps"
                value={listing.details.track_day.passenger_laps_available ? "Available" : undefined}
              />
              <DetailRow label="Operators" value={listing.details.track_day.operators?.join(", ")} />
            </>
          )}

          {listing.details?.karting && (
            <>
              <h3 className="mt-4 mb-1 text-xs font-semibold uppercase text-gray-400">
                {CATEGORY_LABEL.karting}
              </h3>
              <DetailRow label="Kart type" value={listing.details.karting.kart_type} />
              <DetailRow
                label="Top speed"
                value={
                  listing.details.karting.max_kart_speed_kmh
                    ? `${listing.details.karting.max_kart_speed_kmh} km/h`
                    : undefined
                }
              />
              <DetailRow label="Minimum age/height" value={listing.details.karting.min_age_or_height} />
              <DetailRow
                label="League"
                value={listing.details.karting.league_available ? "Available" : undefined}
              />
            </>
          )}

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
