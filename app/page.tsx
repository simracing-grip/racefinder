import Link from "next/link";
import { getListings, getCountries } from "@/lib/listings";
import HomeExplorer from "@/components/Home/HomeExplorer";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const [listings, countries] = await Promise.all([getListings(), getCountries()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-8 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Find your next lap, across Europe
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-400">
          A free, growing directory of sim racing centers, track day circuits, and
          karting tracks.
        </p>
        <Link
          href="/calendar"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm font-medium text-gray-200 hover:border-red-500"
        >
          See upcoming races &rarr;
        </Link>
      </section>

      <HomeExplorer listings={listings} countries={countries} initialCountry={params.country} />
    </div>
  );
}
