import { getListings, getCountries } from "@/lib/listings";
import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RaceFinder — find sim racing, track days, karting and F1 circuits";
// Keeps the venue count in the preview current between deploys.
export const revalidate = 3600;

export default async function Image() {
  const [listings, countries] = await Promise.all([getListings(), getCountries()]);
  return renderOgCard({
    kicker: "Sim · Track days · Karting · F1",
    title: "Find your next lap.",
    subtitle: `${listings.length.toLocaleString("en-GB")} places to drive, race and spectate in ${countries.length} countries`,
  });
}
