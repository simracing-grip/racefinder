import { getCityHub, getVenuesNear, categoryBreakdown, CITY_RADIUS_KM } from "@/lib/cities";
import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard, flagEmoji } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RaceFinder city preview";
export const revalidate = 3600;

// Rendered on first share, then cached (like country and venue previews).
export async function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ country: string; city: string }> }) {
  const { country, city } = await params;
  const hub = await getCityHub(decodeURIComponent(country), decodeURIComponent(city));
  if (!hub) return renderOgCard({ kicker: "RaceFinder", title: "Not found" });

  const nearby = await getVenuesNear(hub);
  const code = nearby.find((n) => n.listing.country === hub.country)?.listing.countryCode;
  const breakdown = categoryBreakdown(nearby.map((n) => n.listing))
    .filter((c) => c.value !== "club_only")
    .map((c) => `${c.count} ${c.label}`)
    .join(" · ");

  return renderOgCard({
    kicker: `${flagEmoji(code)} Places to race near`.trim(),
    title: hub.name,
    subtitle: `${nearby.length} venues within ${CITY_RADIUS_KM} km — ${breakdown}`,
  });
}
