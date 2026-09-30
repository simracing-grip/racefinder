import { getListings, getCountries, slugifyCountry } from "@/lib/listings";
import { CATEGORIES } from "@/lib/types";
import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard, flagEmoji } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RaceFinder country preview";
export const revalidate = 3600;

// Rendered on first share, then cached. Pre-building all ~110 at deploy
// had build workers timing out (each loads fonts, flags and the listings).
export async function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params;
  const country = (await getCountries()).find((c) => slugifyCountry(c) === decodeURIComponent(slug));
  if (!country) return renderOgCard({ kicker: "RaceFinder", title: "Not found" });

  const listings = await getListings({ country });
  const breakdown = CATEGORIES.map((c) => ({ label: c.label, n: listings.filter((l) => l.categories.includes(c.value)).length }))
    .filter((c) => c.n > 0)
    .map((c) => `${c.n} ${c.label}`)
    .join(" · ");

  return renderOgCard({
    kicker: `${flagEmoji(listings[0]?.countryCode)} Places to race`.trim(),
    title: country,
    subtitle: `${listings.length} venues — ${breakdown}`,
  });
}
