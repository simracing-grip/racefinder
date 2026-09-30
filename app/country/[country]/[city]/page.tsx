import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getCityHub, getCityHubs, getVenuesNear, categoryBreakdown, CITY_RADIUS_KM } from "@/lib/cities";
import { CATEGORY_COLOR, CATEGORY_NOUN } from "@/lib/categoryMeta";
import { getNextEvent, formatEventDate } from "@/lib/listingSort";
import { formatDistanceKm, distanceKm } from "@/lib/geo";
import { toSummary } from "@/lib/listingSummary";
import { pageMetadata } from "@/lib/seo";
import type { Listing, TrackEvent } from "@/lib/types";
import PageHeader from "@/components/UI/PageHeader";
import MapListPanel from "@/components/Listing/MapListPanel";
import SeriesBadge from "@/components/Calendar/SeriesBadge";
import CountryFlag from "@/components/CountryFlag";
import CityLinks from "@/components/Listing/CityLinks";

// Rebuilt hourly; all qualifying cities are pre-rendered at deploy.
export const revalidate = 3600;

type Params = { country: string; city: string };

export async function generateStaticParams(): Promise<Params[]> {
  return (await getCityHubs()).map((h) => ({ country: h.countrySlug, city: h.slug }));
}

async function load(params: Promise<Params>) {
  const { country, city } = await params;
  const hub = await getCityHub(decodeURIComponent(country), decodeURIComponent(city));
  if (!hub) return null;
  const nearby = await getVenuesNear(hub);
  return { hub, nearby, breakdown: categoryBreakdown(nearby.map((n) => n.listing)) };
}

// "Karting & Track Days" — the two disciplines with the most venues nearby,
// so the title matches what people around that city actually search for.
function headline(breakdown: ReturnType<typeof categoryBreakdown>): string {
  const top = breakdown
    .filter((c) => c.value !== "club_only")
    .sort((a, b) => b.count - a.count)
    .slice(0, 2)
    .map((c) => (c.value === "f1" ? "F1" : c.label.replace("Track Day", "Track Days")));
  return top.length > 0 ? top.join(" & ") : "Places to race";
}

function joinList(items: string[]): string {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function breakdownSentence(breakdown: ReturnType<typeof categoryBreakdown>): string {
  return joinList(
    [...breakdown]
      .filter((c) => c.value !== "club_only")
      .sort((x, y) => y.count - x.count)
      .map((c) => `${c.count} ${CATEGORY_NOUN[c.value]}${c.count === 1 ? "" : "s"}`)
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const data = await load(params);
  if (!data) return {};
  const { hub, nearby, breakdown } = data;
  return pageMetadata({
    title: `${headline(breakdown)} near ${hub.name}`,
    description: `${nearby.length} places to race within ${CITY_RADIUS_KM} km of ${hub.name}: ${breakdownSentence(
      breakdown
    )}. Map, distances, directions and upcoming race weekends.`,
    path: `/country/${hub.countrySlug}/${hub.slug}`,
    image: `/country/${hub.countrySlug}/${hub.slug}/opengraph-image`,
  });
}

export default async function CityPage({ params }: { params: Promise<Params> }) {
  const data = await load(params);
  if (!data) notFound();
  const { hub, nearby, breakdown } = data;

  const closest = nearby[0];
  const countryCode = nearby.find((n) => n.listing.country === hub.country)?.listing.countryCode;

  const upcoming = nearby
    .map((n) => ({ ...n, event: getNextEvent(n.listing) }))
    .filter((n): n is { listing: Listing; km: number; event: TrackEvent } => !!n.event)
    .sort((a, b) => a.event.startDate.localeCompare(b.event.startDate))
    .slice(0, 6);

  const hubs = await getCityHubs();
  const sameCountry = hubs.filter((h) => h.country === hub.country && h.slug !== hub.slug);
  const nearbyAbroad = hubs
    .filter((h) => h.country !== hub.country && distanceKm(h, hub) < 300)
    .sort((a, b) => distanceKm(a, hub) - distanceKm(b, hub))
    .slice(0, 6);

  return (
    <div>
      <PageHeader
        kicker="Places to race near"
        title={hub.name}
        crumbs={[
          { href: "/", label: "Home" },
          { href: `/country/${hub.countrySlug}`, label: hub.country },
          { href: `/country/${hub.countrySlug}/${hub.slug}`, label: hub.name },
        ]}
        aside={
          <div className="flex items-center gap-4">
            {countryCode && <CountryFlag countryCode={countryCode} className="text-5xl" />}
            <dl className="flex flex-col-reverse border border-white/10 bg-ink/70 px-4 py-3 font-mono">
              <dt className="text-[10px] uppercase tracking-widest text-gray-500">within {CITY_RADIUS_KM} km</dt>
              <dd className="text-3xl font-semibold text-timing">{nearby.length}</dd>
            </dl>
          </div>
        }
      >
        <p>
          There are {nearby.length} places to race within {CITY_RADIUS_KM} km of central {hub.name}:{" "}
          {breakdownSentence(breakdown)}.
          {closest && (
            <>
              {" "}
              The closest to the city centre is{" "}
              <Link href={`/listings/${closest.listing.slug}`} className="link-accent">
                {closest.listing.name}
              </Link>{" "}
              ({formatDistanceKm(closest.km)} away).
            </>
          )}
          {upcoming[0] && (
            <>
              {" "}
              Next race weekend nearby: {upcoming[0].event.name} on {formatEventDate(upcoming[0].event.startDate)}.
            </>
          )}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {breakdown.map((c) => (
            <li key={c.value}>
              <Link
                href={`/category/${c.value}?country=${encodeURIComponent(hub.country)}`}
                className="inline-block border border-white/10 bg-asphalt px-3 py-1.5 font-display text-sm font-bold uppercase italic transition hover:border-white/30"
                style={{ color: CATEGORY_COLOR[c.value] }}
              >
                {c.label} <span className="font-mono text-xs not-italic text-gray-400">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PageHeader>

      <div className="mx-auto max-w-7xl space-y-12 px-4 pt-6">
        <MapListPanel
          listings={nearby.map((n) => toSummary(n.listing))}
          distances={Object.fromEntries(nearby.map((n) => [n.listing.slug, n.km]))}
          title={`Nearest to ${hub.name}`}
          summary="places to race — closest to the city centre first. Tap one to find it on the map."
        />

        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-3xl font-black uppercase italic text-white">
              Race weekends near {hub.name}
            </h2>
            <ol className="divide-y divide-white/5 border border-white/10 bg-asphalt">
              {upcoming.map(({ listing, km, event }) => (
                <li key={`${listing.slug}-${event.name}`}>
                  <Link href={`/listings/${listing.slug}`} className="group flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.03]">
                    <span className="w-16 shrink-0 font-mono text-sm text-gray-300">{formatEventDate(event.startDate)}</span>
                    <SeriesBadge series={event.series} className="hidden sm:inline-block" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-white group-hover:text-signal">{event.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {listing.name} &middot; {formatDistanceKm(km)} from {hub.name}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(sameCountry.length > 0 || nearbyAbroad.length > 0) && (
          <section>
            <h2 className="mb-4 font-display text-3xl font-black uppercase italic text-white">More places to race</h2>
            <CityLinks hubs={[...sameCountry, ...nearbyAbroad]} />
          </section>
        )}
      </div>
    </div>
  );
}
