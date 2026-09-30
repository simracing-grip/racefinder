import { getListingBySlug } from "@/lib/listings";
import { CATEGORY_COLOR, CATEGORY_LABEL } from "@/lib/categoryMeta";
import { getNextEvent, formatEventDate } from "@/lib/listingSort";
import { OG_SIZE, OG_CONTENT_TYPE, renderOgCard, loadPhoto, flagEmoji } from "@/lib/og";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "RaceFinder venue preview";
// Generated on first share, then cached like the venue page itself (the
// empty params list is what lets the dynamic route be cached; see the page).
export const revalidate = 3600;
export async function generateStaticParams() {
  return [];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) {
    return renderOgCard({ kicker: "RaceFinder", title: "Venue not found" });
  }

  const primary = listing.categories[0];
  const next = getNextEvent(listing);
  return renderOgCard({
    kicker: `${flagEmoji(listing.countryCode)} ${CATEGORY_LABEL[primary]}`.trim(),
    title: listing.name,
    subtitle: [listing.city, listing.country].filter(Boolean).join(", "),
    accent: CATEGORY_COLOR[primary],
    photo: await loadPhoto(listing.coverImageUrl),
    // Event names usually include the series already ("Super Formula – Fuji").
    badge: next ? `Next race: ${next.name} · ${formatEventDate(next.startDate)}` : undefined,
  });
}
