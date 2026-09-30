import { Suspense } from "react";
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

  const counts = {} as Record<Category, number>;
  for (const c of CATEGORIES) counts[c.value] = listings.filter((l) => l.categories.includes(c.value)).length;

  return (
    <div className="pb-4">
      <Hero listings={listings} countries={countries} countryCodes={countryCodes} raceCount={events.length} />
      <RaceTicker events={events} />

      <div className="mt-20 space-y-24">
        <NextRace events={events} />
        <DisciplineGrid counts={counts} />
        <Suspense fallback={null}>
          <HomeExplorer listings={listings} />
        </Suspense>
        <IconicCircuits listings={listings} />
        <CountryGrid listings={listings} totalCountries={countries.length} />
        <ListVenueCta />
      </div>
    </div>
  );
}
