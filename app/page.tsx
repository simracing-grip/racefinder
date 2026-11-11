import { getListings, getCountries, getCountryCodeMap } from "@/lib/listings";
import { getUpcomingEvents } from "@/lib/calendar";
import type { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import Hero from "@/components/Home/Hero";
import RaceTicker from "@/components/Home/RaceTicker";
import NextRace from "@/components/Home/NextRace";
import DisciplineGrid from "@/components/Home/DisciplineGrid";
import HomeExplorer from "@/components/Home/HomeExplorer";
import IconicCircuits from "@/components/Home/IconicCircuits";
import CountryGrid from "@/components/Home/CountryGrid";
import ListVenueCta from "@/components/Home/ListVenueCta";

// Served as a cached page, rebuilt at most every 5 minutes (ISR), so
// visitors never wait on the database. Must be a literal number.
export const revalidate = 300;

export const metadata = { alternates: { canonical: "/" } };

// Page order is the pitch: hook (hero + search) → urgency (next race) →
// intent (discipline) → the tool itself (map) → aspiration (iconic
// circuits) → local (countries) → supply side (list your venue).
export default async function HomePage() {
  const [listings, countries, countryCodes, events] = await Promise.all([
    getListings(),
    getCountries(),
    getCountryCodeMap(),
    getUpcomingEvents(),
  ]);

  // The map + list section fetches its venue summaries itself
  // (/api/summaries) when it scrolls near; only the counts go in the page.
  const counts = {} as Record<Category, number>;
  for (const c of CATEGORIES) counts[c.value] = listings.filter((l) => l.categories.includes(c.value)).length;

  return (
    <div className="pb-4">
      <Hero venueCount={listings.length} countries={countries} countryCodes={countryCodes} events={events} />
      <RaceTicker events={events} />

      <div className="mt-20 space-y-24">
        <NextRace events={events} />
        <DisciplineGrid counts={counts} />
        {/* No <Suspense> wrapper: it was only needed while this nested the
            useSearchParams-based FilterBar, and it made the map + list stream
            as a separate chunk that stays hidden until the tab is repainted. */}
        <HomeExplorer counts={counts} total={listings.length} />
        <IconicCircuits listings={listings} />
        <CountryGrid listings={listings} totalCountries={countries.length} />
        <ListVenueCta />
      </div>
    </div>
  );
}
