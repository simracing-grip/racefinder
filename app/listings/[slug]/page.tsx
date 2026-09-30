import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getListingBySlug, getListings } from "@/lib/listings";
import { formatAddress, googleMapsUrl } from "@/lib/formatAddress";
import CategoryBadge from "@/components/Listing/CategoryBadge";
import ListingDetails from "@/components/Listing/ListingDetails";
import MapView from "@/components/Map/MapView";
import CountryFlag from "@/components/CountryFlag";
import Link from "next/link";
import VenuePhoto from "@/components/Listing/VenuePhoto";
import PageHeader from "@/components/UI/PageHeader";
import SeriesBadge from "@/components/Calendar/SeriesBadge";
import Countdown from "@/components/Home/Countdown";
import AddToCalendar from "@/components/Calendar/AddToCalendar";
import { SITE_URL } from "@/lib/site";
import { CATEGORIES } from "@/lib/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_NOUN } from "@/lib/categoryMeta";
import { getNextEvent, formatEventDate } from "@/lib/listingSort";
import { distanceKm, formatDistanceKm } from "@/lib/geo";
import { slugifyCountry } from "@/lib/countrySlug";
import { toSummary } from "@/lib/listingSummary";
import { pageMetadata } from "@/lib/seo";

// Served as a cached page, rebuilt at most every 5 minutes (ISR), so
// visitors never wait on the database. Must be a literal number.
export const revalidate = 300;

// Empty list = build no venue pages up front (3,500+ would slow every
// deploy); each one is rendered on its first visit, then cached like above.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return {};
  const place = [listing.city, listing.country].filter(Boolean).join(", ");
  const next = getNextEvent(listing);
  return pageMetadata({
    title: listing.name,
    description:
      listing.description ??
      `${listing.name} is a ${CATEGORY_NOUN[listing.categories[0]]} in ${place}. Location, directions, contact details${
        next ? ` and the next race weekend (${next.name}, ${formatEventDate(next.startDate)})` : ""
      } on RaceFinder.`,
    path: `/listings/${listing.slug}`,
    image: `/listings/${listing.slug}/opengraph-image`,
  });
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

  const primary = listing.categories[0];
  const categoryMeta = CATEGORIES.find((c) => c.value === primary);
  const accent = CATEGORY_COLOR[primary] ?? "#ff2a2a";
  const nextEvent = getNextEvent(listing);

  // Closest other venues in the same country — served from the in-memory
  // listings cache, so this costs no extra database work.
  const nearby = (await getListings({ country: listing.country }))
    .filter((l) => l.slug !== listing.slug)
    .map((l) => ({ l, km: distanceKm(listing, l) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 6);

  return (
    <div className="pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        kicker={CATEGORY_LABEL[primary]}
        accent={accent}
        title={listing.name}
        crumbs={[
          { href: "/", label: "Home" },
          ...(categoryMeta ? [{ href: `/category/${categoryMeta.value}`, label: categoryMeta.plural }] : []),
          { href: `/country/${slugifyCountry(listing.country)}`, label: listing.country },
        ]}
        aside={
          <div className="flex flex-wrap gap-2">
            {listing.websiteUrl && (
              <a
                href={listing.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-skew inline-flex items-center gap-2 bg-signal px-6 py-3 font-display text-lg font-black uppercase italic text-white transition hover:bg-white hover:text-ink"
              >
                Visit website <span aria-hidden>&#8599;</span>
              </a>
            )}
            <a
              href={googleMapsUrl(listing)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 font-display text-lg font-bold uppercase italic text-white transition hover:border-white"
            >
              Directions <span aria-hidden>&rarr;</span>
            </a>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {listing.categories.map((c) => (
            <CategoryBadge key={c} category={c} />
          ))}
          {listing.featured && (
            <span className="bg-timing px-2 py-0.5 font-display text-xs font-bold uppercase italic text-ink">Featured</span>
          )}
        </div>
        <p className="mt-3 flex items-center gap-2 text-gray-300">
          <CountryFlag countryCode={listing.countryCode} />
          {listing.address ? formatAddress(listing) : `${listing.city}, ${listing.country}`}
        </p>
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-6">
        <VenuePhoto listing={listing} variant="cover" cta className="h-64 border border-white/10 sm:h-[420px]" />

        {nextEvent && (
          <section className="relative flex flex-wrap items-center justify-between gap-5 border border-white/10 bg-panel p-5 sm:p-6">
            {/* Only the texture is clipped, not the section: the Add to calendar menu hangs below it. */}
            <div className="speed-lines pointer-events-none absolute inset-0 overflow-hidden" aria-hidden />
            <div className="relative">
              <p className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.25em] text-timing">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-signal" aria-hidden />
                Next race weekend here
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-3">
                <SeriesBadge series={nextEvent.series} />
                <span className="font-display text-3xl font-black uppercase italic leading-none text-white">{nextEvent.name}</span>
              </p>
              <p className="mt-2 font-mono text-sm text-gray-400">
                {formatEventDate(nextEvent.startDate)}
                {nextEvent.endDate && nextEvent.endDate !== nextEvent.startDate && ` – ${formatEventDate(nextEvent.endDate)}`}
              </p>
            </div>
            <div className="relative flex w-full flex-wrap items-center gap-4 sm:w-auto">
              <Countdown startDate={nextEvent.startDate} endDate={nextEvent.endDate} />
              <AddToCalendar
                siteUrl={SITE_URL}
                event={{
                  ...nextEvent,
                  circuitName: listing.name,
                  city: listing.city,
                  country: listing.country,
                  listingSlug: listing.slug,
                }}
              />
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="border border-white/10 bg-asphalt p-5 sm:p-6">
            <h2 className="font-display text-2xl font-black uppercase italic text-white">Venue details</h2>
            {listing.description && <p className="mt-3 max-w-2xl leading-relaxed text-gray-300">{listing.description}</p>}
            <div className="mt-4">
              {/* description is shown above, so leave it out of the shared details block */}
              <ListingDetails listing={{ ...listing, description: undefined }} />
            </div>
          </section>

          <div className="space-y-4">
            <div className="overflow-hidden border border-white/10">
              <MapView listings={[toSummary(listing)]} height="360px" />
            </div>
            <div className="border border-white/10 bg-panel p-4 text-sm text-gray-400">
              <p className="font-display text-lg font-bold uppercase italic text-white">Run this venue?</p>
              <p className="mt-1">
                Claiming listings is coming soon. Until then,{" "}
                <Link href="/contact" className="link-accent">
                  send us corrections, photos or events
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {nearby.length > 0 && (
          <section className="pt-6">
            <h2 className="mb-4 font-display text-3xl font-black uppercase italic text-white">Nearby venues</h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.map(({ l, km }) => (
                <li key={l.slug}>
                  <Link
                    href={`/listings/${l.slug}`}
                    className="group flex items-center gap-4 border border-white/10 bg-asphalt p-3 transition hover:border-white/30"
                  >
                    {/* only the fields VenuePhoto reads, not the whole record */}
                    <VenuePhoto
                      listing={{ name: l.name, categories: l.categories, coverImageUrl: l.coverImageUrl }}
                      variant="thumb"
                      className="h-14 w-14 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white group-hover:text-signal">{l.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {CATEGORY_LABEL[l.categories[0]]} &middot; {l.city || l.country}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-gray-400">{formatDistanceKm(km)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
